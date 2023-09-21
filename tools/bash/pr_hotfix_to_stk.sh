echo "create pull request to main/stk and develop"
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
          "name": "main/stk"
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
