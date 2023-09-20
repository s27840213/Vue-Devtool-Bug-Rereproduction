#!/bin/bash
echo "start creating pull request"
apt-get update
apt-get -y install curl jq
export BITBUCKET_TRIGGERER_USERNAME=$(curl -X GET -g "https://api.bitbucket.org/2.0/users/${BITBUCKET_STEP_TRIGGERER_UUID}" | jq --raw-output '.display_name')

echo "create pull request to develop"
echo "'"${BITBUCKET_BRANCH}"'"
echo "'"${BITBUCKET_API_TOKEN}"'"
curl --request POST \
    --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
    --header "Accept: application/json" \
    --header "Content-Type: application/json" \
    --header "Authorization: Bearer '"${BITBUCKET_API_TOKEN}"'" \
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
# ATATT3xFfGF0yhLWxN_f5KAE7c5zo_ifAUOY8WULmi4IjUgpu4ZepYTXC8oOtyzYqd689G3hXVW6MqSZH9obEXDvmADwwMbK1paPyMiNk-yPsIsVZnld8tHdquW_zSjLE4nIV9CPLCfP2nE8hSK-d02prbDrM7vG9BbgvkoGy-sW_ZAVYmy_di0=009F7C14
# if [[ "$BITBUCKET_BRANCH" == "app/vivisticker-develop" ]]
# then
#     echo "create pull request to vivisticker"
#     curl --request POST \
#         --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
#         --header "Accept: application/json" \
#         --header "Content-Type: application/json" \
#         --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
#         --data '{
#           "title": "Pull request to vivisticker by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
#           "source": {
#             "branch": {
#               "name": "'"${BITBUCKET_BRANCH}"'"
#             }
#           },
#           "destination": {
#             "branch": {
#               "name": "app/vivisticker"
#             }
#           }
#         }'
# elif [[ "$BITBUCKET_BRANCH" == "develop" ]]
# then
#     echo "create pull request to qa"
#     curl --request POST \
#         --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
#         --header "Accept: application/json" \
#         --header "Content-Type: application/json" \
#         --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
#         --data '{
#           "title": "Pull request to qa by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
#           "source": {
#             "branch": {
#               "name": "'"${BITBUCKET_BRANCH}"'"
#             }
#           },
#           "destination": {
#             "branch": {
#               "name": "qa"
#             }
#           }
#         }'
# elif [[ "$BITBUCKET_BRANCH" == hotfix* ]]
# then
#     echo "create pull request to master, develop, and qa"
#     curl --request POST \
#         --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
#         --header "Accept: application/json" \
#         --header "Content-Type: application/json" \
#         --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
#         --data '{
#           "title": "Pull request to master by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
#           "source": {
#             "branch": {
#               "name": "'"${BITBUCKET_BRANCH}"'"
#             }
#           },
#           "destination": {
#             "branch": {
#               "name": "master"
#             }
#           }
#         }'
#     curl --request POST \
#         --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
#         --header "Accept: application/json" \
#         --header "Content-Type: application/json" \
#         --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
#         --data '{
#           "title": "Pull request to develop by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
#           "source": {
#             "branch": {
#               "name": "'"${BITBUCKET_BRANCH}"'"
#             }
#           },
#           "destination": {
#             "branch": {
#               "name": "develop"
#             }
#           }
#         }'
#     curl --request POST \
#         --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
#         --header "Accept: application/json" \
#         --header "Content-Type: application/json" \
#         --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
#         --data '{
#           "title": "Pull request to qa by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
#           "source": {
#             "branch": {
#               "name": "'"${BITBUCKET_BRANCH}"'"
#             }
#           },
#           "destination": {
#             "branch": {
#               "name": "qa"
#             }
#           }
#         }'
# elif [[ "$BITBUCKET_BRANCH" == "stk-hotfix" ]]
# then
#     echo "create pull request to app/vivisticker and app/vivisticker-develop"
#     curl --request POST \
#         --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
#         --header "Accept: application/json" \
#         --header "Content-Type: application/json" \
#         --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
#         --data '{
#           "title": "Pull request to vivisticker by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
#           "source": {
#             "branch": {
#               "name": "'"${BITBUCKET_BRANCH}"'"
#             }
#           },
#           "destination": {
#             "branch": {
#               "name": "app/vivisticker"
#             }
#           }
#         }'
#     curl --request POST \
#         --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
#         --header "Accept: application/json" \
#         --header "Content-Type: application/json" \
#         --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
#         --data '{
#           "title": "Pull request to vivisticker-develop by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
#           "source": {
#             "branch": {
#               "name": "'"${BITBUCKET_BRANCH}"'"
#             }
#           },
#           "destination": {
#             "branch": {
#               "name": "app/vivisticker-develop"
#             }
#           }
#         }'
# elif [[ "$BITBUCKET_BRANCH" == "qa" ]]
# then
#     echo "create pull request to master"
#     curl --request POST \
#         --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
#         --header "Accept: application/json" \
#         --header "Content-Type: application/json" \
#         --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
#         --data '{
#           "title": "Pull request to master by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
#           "source": {
#             "branch": {
#               "name": "'"${BITBUCKET_BRANCH}"'"
#             }
#           },
#           "destination": {
#             "branch": {
#               "name": "master"
#             }
#           }
#         }'
# else
#     echo "create pull request to develop"
#     curl --request POST \
#         --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
#         --header "Accept: application/json" \
#         --header "Content-Type: application/json" \
#         --header "Authorization: Basic '"${BITBUCKET_API_TOKEN}"'" \
#         --data '{
#           "title": "Pull request to develop by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
#           "source": {
#             "branch": {
#               "name": "'"${BITBUCKET_BRANCH}"'"
#             }
#           },
#           "destination": {
#             "branch": {
#               "name": "develop"
#             }
#           }
#         }'
# fi

