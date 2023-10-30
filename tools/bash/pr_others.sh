#!/bin/bash
echo "start creating pull request"
apt-get update
apt-get -y install curl jq
export BITBUCKET_TRIGGERER_USERNAME=$(curl -X GET -g "https://api.bitbucket.org/2.0/users/${BITBUCKET_STEP_TRIGGERER_UUID}" | jq --raw-output '.display_name')

if [[ "$BITBUCKET_BRANCH" == "qa" ]]
then
    echo "create pull request to main/vivipic"
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
        --data '{
          "title": "Pull request to main/vivipic by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "main/vivipic"
            }
          }
        }'
elif [[ "$BITBUCKET_BRANCH" == "qa-stk" ]]
then
    echo "create pull request to main/stk"
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
        --data '{
          "title": "Pull request to main/stk by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "main/stk"
            }
          }
        }'
# for feature, test, bugfix branch
else
    echo "create pull request to develop"
    echo "${BITBUCKET_BRANCH}"
    echo "${BITBUCKET_API_TOKEN}"
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
        --data '{
          "title": "Pull request to develop by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "develop"
            }
          }
        }'
fi
