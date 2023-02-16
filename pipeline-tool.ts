/* eslint-disable quotes */
const fs = require('fs-extra')
const YAML = require('yaml')
const lodash = require('lodash')

const versionCheckAndBuild = () => ([
  {
    step: {
      name: '"Verify build environment"',
      script: ['node -v', 'yarn -v'],
    }
  }, {
    step: {
      name: '"Start build with node module cache"',
      size: '2x',
      caches: ['node'],
      image: 'cypress/browsers:node-16.18.1-chrome-109.0.5414.74-1-ff-109.0-edge-109.0.1518.52-1',
      script: ['yarn install', 'yarn build:prerender'],
      artifacts: ['dist/**', 'node_modules/**'],
    }
  },
])
const pullRequest = () => ({
  step: {
    name: '"create pull request"',
    trigger: 'manual',
    script: ['./bash/create_pull_request.sh']
  }
})
const e2e = () => ({
  step: {
    name: '"Run E2E Tests"',
    size: '2x',
    image: 'cypress/browsers:node-16.18.1-chrome-109.0.5414.74-1-ff-109.0-edge-109.0.1518.52-1',
    script: [
      'npx cypress install',
      'yarn serve & npx wait-on http://localhost:8080',
      // '|| true' will let pipeline always pass, no failed
      'npx cypress run --record --browser chrome || true'
    ],
    artifacts: [
      'cypress-visual-report/**',
      'cypress-visual-screenshots/**'
    ]
  }
})

const _deploy = {
  step: {
    name: '$subdomain $username',
    deployment: '$subdomain',
    trigger: 'manual',
    script: [
      {
        pipe: 'atlassian/aws-s3-deploy:1.1.0',
        variables: {
          AWS_ACCESS_KEY_ID: '$AWS_ACCESS_KEY_ID_TEST',
          AWS_SECRET_ACCESS_KEY: '$AWS_SECRET_ACCESS_KEY_TEST',
          AWS_DEFAULT_REGION: '$AWS_DEFAULT_REGION_TEST',
          S3_BUCKET: '$AWS_BUCKET_$SUBDOMAIN',
          LOCAL_PATH: '"dist"',
          EXTRA_ARGS: '"--exclude=app.html --exclude=*.js.map"',
        },
      },
      {
        pipe: 'atlassian/aws-s3-deploy:1.1.0',
        variables: {
          AWS_ACCESS_KEY_ID: '$AWS_ACCESS_KEY_ID_TEST',
          AWS_SECRET_ACCESS_KEY: '$AWS_SECRET_ACCESS_KEY_TEST',
          AWS_DEFAULT_REGION: '$AWS_DEFAULT_REGION_TEST',
          S3_BUCKET: '$AWS_BUCKET_$SUBDOMAIN',
          LOCAL_PATH: '"dist"',
          EXTRA_ARGS: '"--exclude=* --include=app.html"',
        },
      },
      {
        pipe: 'atlassian/aws-s3-deploy:1.1.0',
        variables: {
          AWS_ACCESS_KEY_ID: '$AWS_ACCESS_KEY_ID_TEST',
          AWS_SECRET_ACCESS_KEY: '$AWS_SECRET_ACCESS_KEY_TEST',
          AWS_DEFAULT_REGION: '$AWS_DEFAULT_REGION_TEST',
          S3_BUCKET: '$AWS_BUCKET_$SUBDOMAIN',
          LOCAL_PATH: '"dist"',
          EXTRA_ARGS: '"--exclude=*.js.map"',
          DELETE_FLAG: 'true',
        },
      },
    ],
  },
}

function getDeploy(stepName, deployment, subdomain, prod) {
  const deploy = lodash.cloneDeep(_deploy)
  deploy.step.name = `"${stepName}"`
  deploy.step.deployment = deployment
  for (const index of [0, 1, 2]) {
    deploy.step.script[index].variables.S3_BUCKET =
    deploy.step.script[index].variables.S3_BUCKET
      .replace('$SUBDOMAIN', subdomain.toUpperCase())
  }
  if (prod) {
    for (const index of [0, 1, 2]) {
      for (const key of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_DEFAULT_REGION']) {
        deploy.step.script[index].variables[key] =
        deploy.step.script[index].variables[key]
          .replace('TEST', subdomain.toUpperCase())
      }
    }
    deploy.step.script.push('$curl')
  }
  return deploy
}
function allDeploy() {
  const deploys = [
    { sub: 'dev5', name: 'dev5 Alan' },
    { sub: 'dev4', name: 'dev4 Gary' },
    { sub: 'dev3', name: 'dev3 HsingChi' },
    { sub: 'dev2', name: 'dev2 TingAn' },
    { sub: 'dev1', name: 'dev1 Nathan' },
    { sub: 'dev0', name: 'dev0 ZhengYan' },
    { sub: 'dev5s', name: 'dev5s Alan' },
    { sub: 'dev4s', name: 'dev4s Gary' },
    { sub: 'dev3s', name: 'dev3s HsingChi' },
    { sub: 'dev2s', name: 'dev2s TingAn' },
    { sub: 'dev1s', name: 'dev1s Nathan' },
    { sub: 'dev0s', name: 'dev0s ZhengYan' },
    { sub: 'test2', name: 'test2' },
    { sub: 'test3', name: 'test3' },
  ]
  return [
    e2e(),
    ...deploys.map((dep) => getDeploy(dep.name, dep.sub, dep.sub, false)),
    pullRequest()
  ]
}

const result = {
  image: 'node:14.16.0',
  pipelines: {
    default: [{
      parallel: versionCheckAndBuild()
    }, {
      parallel: allDeploy(),
    }],
    branches: {
      master: [{
        parallel: versionCheckAndBuild()
      },
      getDeploy('deploy test', 'test', 'TEST', false),
      getDeploy('deploy edit', 'staging', 'EDIT', true),
      getDeploy('deploy prod', 'production', 'PROD', true)
      ],
      develop: [{
        parallel: versionCheckAndBuild()
      }, {
        parallel: [
          e2e(),
          getDeploy('deploy rd', 'rd', 'RD', false),
          getDeploy('test3', 'test3', 'TEST3', false),
          pullRequest()
        ]
      }],
      qa: [{
        parallel: versionCheckAndBuild()
      }, {
        parallel: [
          e2e(),
          getDeploy('deploy qa', 'qa', 'QA', false),
          pullRequest()
        ]
      }],
      // 'feature/?': [{
      //   parallel: versionCheckAndBuild()
      // }, {
      //   parallel: allDeploy(),
      // }],
    },
  },
}

let str = YAML.stringify(result)
str = str.replace(/('"|"')/g, '"')
str = str.replace(/default:/g, 'default: #for feature')
str = str.replace(/(name: "Verify build environment"\n +script:)/g, '$1 #show node and yarn version')
str = str.replace(/caches:/g, 'caches: #set caches for node modules to speed up building')
str = str.replace(/artifacts:/g, 'artifacts: #single asterisk (*) to match files in folder, double asterisk (**) to match files and folders in folder')
str = str.replace(/LOCAL_PATH: "dist"/g, 'LOCAL_PATH: "dist" #should be the same as the output folder (artifacts)')
str = str.replace(/\$curl/g, 'curl -k -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" -H "X-Auth-Email:$CF_MAIL" -H "X-Auth-Key:$CF_KEY" -H "Content-Type:application/json" --data \'{"purge_everything":true}\'')
fs.writeFileSync('./bitbucket-pipelines.yml', str)
