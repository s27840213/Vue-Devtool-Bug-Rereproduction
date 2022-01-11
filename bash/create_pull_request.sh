#!/bin/bash
apt-get update
apt-get -y install curl jq
[[ "$BITBUCKET_BRANCH" == "develop" || $BITBUCKET_BRANCH == bugfix/* ]] && export DESTINATION_BRANCH="develop" || export DESTINATION_BRANCH="master"
export BITBUCKET_TRIGGERER_USERNAME=$(curl -X GET -g "https://api.bitbucket.org/2.0/users/${BITBUCKET_STEP_TRIGGERER_UUID}" | jq --raw-output '.display_name')
if [[ "$BITBUCKET_BRANCH" == "develop" ]]
then
    echo "create pull request to master"
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/nueditor/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
        --data '{
          "title": "Pull request to develop by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "master"
            }
          }
        }'
elif [[ "$BITBUCKET_BRANCH" == hotfix* ]]
then
    echo "create pull request to master and develop"
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/nueditor/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
        --data '{
          "title": "Pull request to develop by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "master"
            }
          }
        }'
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/nueditor/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
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
else
    echo "create pull request to master"
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/nueditor/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
        --data '{
          "title": "Pull request to develop by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "master"
            }
          }
        }'
fi

