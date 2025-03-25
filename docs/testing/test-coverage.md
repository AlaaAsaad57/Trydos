# Test Coverage

## Coverage Configuration

The project uses NYC (Istanbul) for code coverage reporting with Cypress integration.

### Webpack Configuration

Coverage instrumentation in `next.config.js`:
```javascript
{
  test: /\.(js|jsx|ts|tsx)$/,
  enforce: "post",
  use: [{
    loader: "istanbul-instrumenter-loader",
    options: { esModules: true }
  }],
  include: [
    path.resolve(__dirname, "store"),
    path.resolve(__dirname, "components"),
    path.resolve(__dirname, "services"),
  ]
}
```

## Running Coverage Reports

### Local Development
```bash
# Run tests with coverage
yarn test

# Open coverage report
yarn open-coverage
```

### CI Pipeline Coverage

Coverage is automatically generated in GitLab CI:
```yaml
build-app:
  script:
    - npx nyc cypress run
    - npx codecov --token=$CODECOV_TOKEN
  artifacts:
    paths:
      - coverage
```

## Coverage Artifacts

Coverage reports are generated in:
- `/coverage/*`
- `.nyc_output/*`