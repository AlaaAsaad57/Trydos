# Cypress Testing

## Configuration

The project uses Cypress for end-to-end testing with the following key features:

- Chrome browser testing
- Code coverage reporting
- Mochawesome reporter
- Automatic retries
- Browser permissions handling

## Running Tests

### Development Mode

To open Cypress in development mode:

```bash
yarn cypress
```

### Headless Mode

To run tests in headless mode with coverage:

```bash
yarn test
```

## Coverage Reports

Coverage reports are generated in the `/coverage` directory. To view the coverage report:

```bash
yarn open-coverage
```

## CI/CD Integration

Tests are automatically run in the CI pipeline using GitLab CI. The configuration includes:

- Chrome browser environment
- Coverage reporting to Codecov
- Artifact preservation
- Automatic retries on failure