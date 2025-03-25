# CI/CD Pipeline

## GitLab CI Configuration

The project uses GitLab CI for continuous integration and deployment.

### Pipeline Stages
```yaml
stages:
  - build & test
  - deploy
```

### Build & Test Stage

```yaml
build-app:
  image: cypress/browsers:node-20.9.0-chrome-118.0.5993.88-1
  script:
    - yarn
    - npx next build --no-lint
    - npx next start &
    - npx wait-on http://localhost:3000
    - npx nyc cypress run
  artifacts:
    paths:
      - cypress/screenshots
      - cypress/reports
      - coverage
```

### Deployment Stage

```yaml
deploy:
  image: node:20.9.0
  stage: deploy
  script:
    - echo "Deploy to Vercel"
```

## Artifacts

The pipeline preserves:
- Test screenshots
- Coverage reports
- Cypress reports

## Cache Configuration

```yaml
cache:
  paths:
    - node_modules/
```