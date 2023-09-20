#!/bin/bash
echo "start creating pull request"
apt-get update
apt-get -y install curl jq
export BITBUCKET_TRIGGERER_USERNAME=$(curl -X GET -g "https://api.bitbucket.org/2.0/users/${BITBUCKET_STEP_TRIGGERER_UUID}" | jq --raw-output '.display_name')

if [[ "$BITBUCKET_BRANCH" == "hotfix" ]]
then
    echo "create pull request to master/*, develop, and qa"
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
        --data '{
          "title": "Pull request to vivisticker by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "master/vivipic"
            }
          }
        }'
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
              "name": "master/stk"
            }
          }
        }'
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
        --data '{
          "title": "Pull request to qa by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "master/cm"
            }
          }
        }'
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
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
        --data '{
          "title": "Pull request to qa by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "qa"
            }
          }
        }'
elif [[ "$BITBUCKET_BRANCH" == "hotfix/vivipic" ]]
then
    echo "create pull request to master/vivipic, develop, and qa"
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
        --data '{
          "title": "Pull request to master/vivipic by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "master/vivipic"
            }
          }
        }'
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
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
        --data '{
          "title": "Pull request to qa by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "qa"
            }
          }
        }'
elif [[ "$BITBUCKET_BRANCH" == "hotfix/stk" ]]
then
    echo "create pull request to master/stk and develop"
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
        --data '{
          "title": "Pull request to vivisticker by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "master/stk"
            }
          }
        }'
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
        --data '{
          "title": "Pull request to vivisticker-develop by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
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
elif [[ "$BITBUCKET_BRANCH" == "hotfix/cm" ]]
then
    echo "create pull request to master/cm and develop"
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
        --data '{
          "title": "Pull request to vivisticker by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "master/cm"
            }
          }
        }'
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
        --data '{
          "title": "Pull request to vivisticker-develop by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
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
elif [[ "$BITBUCKET_BRANCH" == "qa" ]]
then
    echo "create pull request to master"
    curl --request POST \
        --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
        --header "Accept: application/json" \
        --header "Content-Type: application/json" \
        --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
        --data '{
          "title": "Pull request to master by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
          "source": {
            "branch": {
              "name": "'"${BITBUCKET_BRANCH}"'"
            }
          },
          "destination": {
            "branch": {
              "name": "master/vivipic"
            }
          }
        }'
# for feature branch
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

