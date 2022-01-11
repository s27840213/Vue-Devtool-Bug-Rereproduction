#!/bin/bash
echo "create pull request"
apt-get update
apt-get -y install curl jq
export BITBUCKET_TRIGGERER_USERNAME=$(curl -X GET -g "https://api.bitbucket.org/2.0/users/${BITBUCKET_STEP_TRIGGERER_UUID}" | jq --raw-output '.display_name')
echo ${BITBUCKET_TRIGGERER_USERNAME}
#export DEFAULT_REVIEWERS=$(curl https://api.bitbucket.org/2.0/repositories/${BITBUCKET_REPO_OWNER}/${BITBUCKET_REPO_SLUG}/default-reviewers \
#    -s -S -f -X GET \
#    -H "Authorization: Bearer ${BB_TOKEN}" | jq '.values' | jq 'map({uuid})' |  jq '.[] | select(.uuid!="{'"${BITBUCKET_STEP_TRIGGERER_UUID}"'}")')
#curl --request POST \
#    --url "https://api.bitbucket.org/2.0/repositories/mingchi/nueditor/pullrequests" \
#    --header "Accept: application/json" \
#    --header "Content-Type: application/json" \
#    --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
#    --data '{
#      "title": "Pull request to develop by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
#      "source": {
#        "branch": {
#          "name": "'"${BITBUCKET_BRANCH}"'"
#        }
#      },
#      "destination": {
#        "branch": {
#          "name": "develop"
#        }
#      },
#      "reviewers": '"${DEFAULT_REVIEWERS}"'
#    }'
