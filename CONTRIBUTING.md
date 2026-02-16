# Contributing to Pre-Flight Assistant

Thanks for your interest in contributing. This document covers how to get set up, run tests, and submit changes.

## Getting started

1. **Clone the repository**

   ```bash
   git clone https://github.com/hugsndnugs/I-Swear-I-Packed-It.git
   cd I-Swear-I-Packed-It
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the app locally**

   ```bash
   npm run dev
   ```

   Open http://localhost:5173 (or the URL shown).

## Running tests

```bash
npm run test
```

For watch mode during development:

```bash
npm run test:watch
```

## Building

```bash
npm run build
```

The output is in `dist/`. Use `npm run preview` to serve it locally. CI uses `npm run build:ci` (no ship API fetch).

## Submitting changes

1. Create a branch from `main` for your change.
2. Make your edits and run `npm run test` and `npm run build` to confirm everything passes.
3. Open a pull request against `main` with a clear description of the change.
4. Ensure the PR passes CI (tests and build).

## Code of conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.
