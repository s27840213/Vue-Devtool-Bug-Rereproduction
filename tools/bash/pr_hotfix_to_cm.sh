echo "create pull request to main/cm, develop, and qa-cm"
curl --request POST \
    --url "https://api.bitbucket.org/2.0/repositories/mingchi/frontend-web/pullrequests" \
    --header "Accept: application/json" \
    --header "Content-Type: application/json" \
    --header "Authorization: Bearer ${BITBUCKET_API_TOKEN}" \
    --data '{
      "title": "Pull request to charmix by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
      "source": {
        "branch": {
          "name": "'"${BITBUCKET_BRANCH}"'"
        }
      },
      "destination": {
        "branch": {
          "name": "main/cm"
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
      "title": "Pull request to qa-cm by '"${BITBUCKET_TRIGGERER_USERNAME}"'",
      "source": {
        "branch": {
          "name": "'"${BITBUCKET_BRANCH}"'"
        }
      },
      "destination": {
        "branch": {
          "name": "qa-cm"
        }
      }
    }'

