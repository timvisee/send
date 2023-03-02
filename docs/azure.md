# Deployment to Azure

## Minimal deployment
This document describes how to do a minimal deployment of Send in Azure

### Resources

* A Storage Account **with a least one container created** (Standard V2, Cool access tier)
* An Azure Redis Cache instance (Basic C0)
* An Azure Container Apps Environment (to host Send in a "serverless" manner )


The "Send" application will be hosted in a [Azure Container App](https://learn.microsoft.com/en-us/azure/container-apps/),
which will allow it to scale up and down. This will also allow to scale to 0 instances, thus preventing any cost when the app
is not used.

The Redis cache used is the smallest available. Although redis could be hosted in any generic container solution, this
"PaaS" approach is the best to prevent data loss.

The storage Account used is "Cold", which will increase a bit latency but once again reduce total cost. As this doesn't
decrease download speed, this should be plenty sufficient for this app.

### Authentication

Using the [identity](https://www.npmjs.com/package/@azure/identity/v/1.3.0) module, multiples ways to handle authentication
are provided. In a nutshell :
- On Azure, resources will use their [Managed Identities](https://learn.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview), to
minimise the use of credentials (Redis still requires it).
- While developing, it will use the Azure CLI
- On more complex scenarios (multi-cloud, mix of on premises and cloud), you'll have to revert to using [Service principals](https://learn.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal)

### Using Azure CLI

```sh
# Parameters
# Resource group name
RG_NAME="mozilla-send-on-azure"
# Az region to deploy inyo
LOC="westeurope"
# Send container image to deploy
IMG="registry.gitlab.com/timvisee/send:latest"

################################
#           Constants          #
################################
# Some resources names cannot contain hyphens or spaces
SAFE_RG_NAME=$(sed 's/-//g; s/\s+//g' <<<"$RG_NAME")
ST_NAME="${SAFE_RG_NAME}sa"
ST_CONTAINER_NAME="files"
ST_ACCESS="Cool"

# Basic redis
REDIS_NAME="$RG_NAME-cache"
REDIS_SKU="basic"
REDIS_SIZE="C0"

ENV_NAME="$RG_NAME-aca-env"

SEND_NAME="send"
# Scale out properties. Allow to scale to 0
# By default, sclae out will occur with traffic
SEND_MIN_REPLICAS=0
SEND_MAX_REPLICAS=10
# Spec of a single send instance
SEND_CPU=0.25
SEND_MEMORY="0.5Gi"

################################
#           Script             #
################################
az group create --name $RG_NAME --location $LOC

# Init the backing services

#   Storage account
az storage account create -n $ST_NAME -g $RG_NAME -l $LOC \
    --sku "Standard_LRS" --access-tier $ST_ACCESS

az storage container create -n $ST_CONTAINER_NAME --account-name $ST_NAME \
    --public-access "off"

#   Redis (This can take a good 15 minutes )
az redis create --name $REDIS_NAME --resource-group $RG_NAME --location "$LOC" \
    --sku $REDIS_SKU --vm-size $REDIS_SIZE \
    --enable-non-ssl-port \
    --mi-system-assigned
redisKey=`az redis list-keys -g $RG_NAME -n $REDIS_NAME | jq -r '.primaryKey'`


# Next, create the send app itself
az containerapp env create --name $ENV_NAME -g $RG_NAME --location $LOC
az containerapp create -n $SEND_NAME -g "$RG_NAME" \
    --image "$IMG" --environment "$ENV_NAME" \
    --cpu $SEND_CPU --memory $SEND_MEMORY \
    --min-replicas $SEND_MIN_REPLICAS --max-replicas $SEND_MAX_REPLICAS \
    --ingress external --target-port 1443 \
    --secrets rediskey=$redisKey \
    --system-assigned \
    --env-vars \
        REDIS_HOST=$REDIS_NAME.redis.cache.windows.net \
        REDIS_PASSWORD=secretref:rediskey \
        AZ_STORAGE_URL=https://$ST_NAME.blob.core.windows.net \
        AZ_STORAGE_CONTAINER=files \
        DETECT_BASE_URL=true


# Authorize the send app to access the storage account through its managed identity
sendIdentityId=`az containerapp identity show -n $SEND_NAME -g $RG_NAME | jq -r '.principalId'`
stIdentity=`az storage account show -n $ST_NAME -g $RG_NAME --query id --output tsv`
az role assignment create --assignee "$sendIdentityId" \
--role "Storage Blob Data Contributor" \
--scope "$stIdentity"

sendHost=`az containerapp ingress show -g $RG_NAME -n $SEND_NAME | jq -r '.fqdn'`
echo "Send is up on https://$sendHost"
```

Send is now fully deployed, and you should be able to access it with the url echoed by the script


## Going further

### About security

This minimal deployment is not fully secure. Although all the resources are configured to reject any public connections
attempts, connections from Azure networks will still go through. This isn't a real problem for the backing storage, as
only the "send" application is authorized to read/write to the Storage account through its managed identity.
Redis on the other hand is using credentials, and could be vulnerable to a bruteforce attack from another Azure network.

To prevent this :
- The Container app environment should use a [custom Virtual Network](https://learn.microsoft.com/en-us/azure/container-apps/vnet-custom?tabs=bash&pivots=azure-portal)
- A [Private Endpoint](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview) should be attached to the redis cache instance and injected in the same network as the environment

This would ensure that only the "send" app is able to resolve Redis' name.

This would however add a substantial amount to the total cost, which is why this is not in the terraform gist above.

