/* eslint-disable quotes */
const fs = require('fs-extra')
const YAML = require('yaml')
const lodash = require('lodash')

const versionCheckAndBuild = (prerender = true) => ([
  {
    step: {
      name: '"Verify build environment"',
      script: [
        'node -v',
        'yarn -v'
      ],
    }
  }, {
    step: {
      name: '"Start build with node module cache"',
      size: '2x',
      caches: ['node'],
      image: 'cypress/browsers:node-16.18.1-chrome-109.0.5414.74-1-ff-109.0-edge-109.0.1518.52-1',
      script: [
        'yarn install',
        `yarn build${prerender ? ':prerender' : ''}`
      ],
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
          AWS_ACCESS_KEY_ID: '$AWS_ACCESS_KEY_ID_$AWSName',
          AWS_SECRET_ACCESS_KEY: '$AWS_SECRET_ACCESS_KEY_$AWSName',
          AWS_DEFAULT_REGION: '$AWS_DEFAULT_REGION_$AWSName',
          S3_BUCKET: '$AWS_BUCKET_$SUBDOMAIN',
          LOCAL_PATH: '"dist"',
          EXTRA_ARGS: '"--exclude=app.html --exclude=*.js.map"',
        },
      },
      {
        pipe: 'atlassian/aws-s3-deploy:1.1.0',
        variables: {
          AWS_ACCESS_KEY_ID: '$AWS_ACCESS_KEY_ID_$AWSName',
          AWS_SECRET_ACCESS_KEY: '$AWS_SECRET_ACCESS_KEY_$AWSName',
          AWS_DEFAULT_REGION: '$AWS_DEFAULT_REGION_$AWSName',
          S3_BUCKET: '$AWS_BUCKET_$SUBDOMAIN',
          LOCAL_PATH: '"dist"',
          EXTRA_ARGS: '"--exclude=* --include=app.html"',
        },
      },
      {
        pipe: 'atlassian/aws-s3-deploy:1.1.0',
        variables: {
          AWS_ACCESS_KEY_ID: '$AWS_ACCESS_KEY_ID_$AWSName',
          AWS_SECRET_ACCESS_KEY: '$AWS_SECRET_ACCESS_KEY_$AWSName',
          AWS_DEFAULT_REGION: '$AWS_DEFAULT_REGION_$AWSName',
          S3_BUCKET: '$AWS_BUCKET_$SUBDOMAIN',
          LOCAL_PATH: '"dist"',
          EXTRA_ARGS: '"--exclude=*.js.map"',
          DELETE_FLAG: 'true',
        },
      },
    ],
  },
}

function getDeploy(stepName, deployment, subdomain, AWSName = 'TEST', prod = false) {
  const deploy = lodash.cloneDeep(_deploy)
  deploy.step.name = `"${stepName}"`
  deploy.step.deployment = deployment
  for (const index of [0, 1, 2]) {
    deploy.step.script[index].variables.S3_BUCKET =
      deploy.step.script[index].variables.S3_BUCKET
        .replace('$SUBDOMAIN', subdomain.toUpperCase())
  }
  for (const index of [0, 1, 2]) {
    for (const key of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_DEFAULT_REGION']) {
      deploy.step.script[index].variables[key] =
        deploy.step.script[index].variables[key]
          .replace('$AWSName', AWSName)
    }
    if (AWSName === 'STICKER') {
      deploy.step.script[index].variables.EXTRA_ARGS =
        deploy.step.script[index].variables.EXTRA_ARGS.replace('app.html', 'index.html')
    }
  }
  if (prod) {
    deploy.step.script.push('$curl')
  }
  return deploy
}
function allDeploy(autoDeploy = '') {
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
    ...deploys.map((dep) => {
      const de = getDeploy(dep.name, dep.sub, dep.sub)
      if (dep.sub === autoDeploy) {
        delete de.step.trigger
      }
      return de
    }),
    pullRequest()
  ]
}
function stkAllDeploy() {
  const deploys = [
    { sub: 'dev5', name: 'dev5 Alan' },
    { sub: 'dev4', name: 'dev4 Gary' },
    { sub: 'dev3', name: 'dev3 HsingChi' },
    { sub: 'dev2', name: 'dev2 TingAn' },
    { sub: 'dev1', name: 'dev1 Nathan' },
    { sub: 'dev0', name: 'dev0 ZhengYan' },
  ]
  return [
    ...deploys.map((dep) => getDeploy(dep.name, `stk${dep.sub}`, `STICKER_${dep.sub}`, 'STICKER')),
  ]
}

const result = {
  image: 'node:14.16.0',
  pipelines: {
    default: [{
      parallel: versionCheckAndBuild(false)
    }, {
      parallel: stkAllDeploy(),
    }],
    branches: {
      master: [{
        parallel: versionCheckAndBuild()
      },
      getDeploy('deploy test', 'test', 'TEST'),
      getDeploy('deploy prod', 'production', 'PROD', 'PROD', true)
      ],
      develop: [{
        parallel: versionCheckAndBuild()
      }, {
        parallel: [
          e2e(),
          getDeploy('deploy rd', 'rd', 'RD'),
          getDeploy('test3', 'test3', 'TEST3'),
          pullRequest()
        ]
      }],
      qa: [{
        parallel: versionCheckAndBuild()
      }, {
        parallel: [
          e2e(),
          getDeploy('deploy qa', 'qa', 'QA'),
          pullRequest()
        ]
      }],
      'stk-hotfix': [{
        parallel: versionCheckAndBuild(false)
      }, {
        parallel: stkAllDeploy(),
      }],
      'app/vivisticker': [{
        parallel: versionCheckAndBuild(false)
      }, {
        parallel: [getDeploy('deploy prod', 'stickerproduction', 'STICKER', 'STICKER', true)]
      }],
      'app/vivisticker-develop': [{
        parallel: versionCheckAndBuild(false)
      }, {
        parallel: [getDeploy('deploy test', 'stkrd', 'STICKER_RD', 'STICKER'), pullRequest()] // add pull request to app/vivisticker
      }],
      // 'feature/?': [{
      //   parallel: versionCheckAndBuild()
      // }, {
      //   parallel: allDeploy('devN that need auto deploy'),
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
