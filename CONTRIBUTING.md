# Contributing to OGI

Thank you for your interest in contributing to OGI (Open Geopolitical Intelligence)! This document provides guidelines for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report:

1. Check the [issues](https://github.com/kyronsatt/open-geopolitical-intelligence/issues) to see if the issue has already been reported
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Your environment details (OS, browser, Node version)
   - Screenshots if applicable
   - Error messages

### Suggesting Features

We welcome feature suggestions! When proposing a new feature:

1. Check existing issues and discussions
2. Describe the problem you're trying to solve
3. Explain your proposed solution
4. Consider alternative approaches

### Pull Requests

#### Pull Request Process

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

4. **Make your changes** following our coding standards

5. **Test your changes**:

   ```bash
   npm run test        # Run tests
   npm run lint        # Check linting
   npm run build       # Verify build passes
   ```

6. **Commit** with clear, descriptive messages:

   ```bash
   git commit -m "feat: add new visualization component"
   # or
   git commit -m "fix: resolve zoom scroll issue"
   ```

7. **Push** to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request** with:
   - Clear title and description
   - Link to related issues
   - Screenshots for UI changes
   - Notes on testing performed

## Coding Standards

### TypeScript

- Use strict TypeScript
- Prefer interfaces over types for objects
- Export types that are reused
- Use meaningful variable names

### React

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper TypeScript types for props

### CSS / Tailwind

- Use Tailwind utility classes
- Follow the project's color scheme
- Ensure responsive design
- Test across different screen sizes

### Git Commit Messages

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Adding tests
- `chore:` Maintenance

Example:

```
feat(conflict): add dynamic status badges to conflict header

- Implemented getStatusBadge helper for conflict.status
- Added confidence badge from snapshot analysis
- Fixed intensity display in progress bar
```

## Project Setup

### Development Environment

1. Install Node.js 18+
2. Clone the repository
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and configure
5. Run `npm run dev` to start the dev server

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Building

```bash
# Development build
npm run build:dev

# Production build
npm run build
```

## Component Guidelines

### Creating New Components

1. Use the established folder structure
2. Follow the naming convention (PascalCase for components)
3. Include proper TypeScript types
4. Add JSDoc comments for complex logic

### UI Components

- Use shadcn/ui components when possible
- Follow the design system in `tailwind.config.ts`
- Ensure accessibility (keyboard navigation, screen readers)

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments to new functions
- Update this CONTRIBUTING.md if processes change

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Discord/Community

## Questions?

- Open a [discussion](https://github.com/kyronsatt/open-geopolitical-intelligence/discussions)
- Join our [Discord community](https://discord.gg/your-server)
- Email: contact@kyronsatt.com

---

_Thank you for contributing to OGI!_
