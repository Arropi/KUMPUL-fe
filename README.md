# Gelanggang Expo 2026

[![Figma](https://github.com/user-attachments/assets/b5c744bb-a10f-42d6-88c8-6a49092894bb)](https://www.figma.com/files/team/1500153845149023240/project/377915217/GELEX-2025?fuid=1340235191261999086) ![Contributors](https://img.shields.io/badge/contributors-7-83f28f)

##

## 🚀 Getting Started

Make sure to populate your `.env` files first.

For instructions on how to run this project using Docker, please see the [Docker Usage documentation](./docs/docker.md).

## 📝 Commit Convention

We follow a [standardized commit message](https://conventionalcommits.org) format to maintain a clean and informative git history. Each commit message should be structured as follows:

```
<type>(<scope>): <subject>
```

### Types:

-   **feat**: A new feature
-   **fix**: A bug fix
-   **build**: Changes to libraries, etc
-   **docs**: Documentation changes
-   **refactor**: Code changes that neither fix a bug nor add a feature
-   **perf**: Changes that improve performance
-   **test**: Adding or updating tests
-   **chore**: Changes to build process, auxiliary tools, or libraries

### Scope:

The scope is optional and can be anything specifying the place of the commit change (component, page, or file name).

### Subject:

The subject contains a brief description of the change:

-   Use the imperative, present tense: "change" not "changed" nor "changes"
-   Don't capitalize the first letter
-   No period (.) at the end

### Examples:

```
feat(auth): add login page
fix(navbar): correct responsive display issue
docs(readme): update installation instructions
refactor(api): improve error handling
```

## 🌿 Branch Convention

To maintain an organized repository, we use the following branch naming convention:

```
<type>/<description>
```

### Types:

-   **feat**: For developing new features
-   **fix**: For fixing bugs
-   **docs**: For documentation updates
-   **refactor**: For code refactoring that doesn't add new features or fix bugs

### Description:

A brief description using kebab-case (words separated by hyphens) that captures what the branch is about.

### Examples:

```
feat/landing-page
fix/login-validation
docs/api-documentation
refactor/cleanup-components
```

### Workflow:

1. Create a new branch from `main` (or current development branch)
```bash
git checkout -b <branch-name>
```
2. Work on your changes
3. Run the build process and ensure there are no errors
```bash
npm run build
```
4. Create a pull request
5. Resolve merge conflicts if any, then re-run the build process
6. Submit the pull request for review
7. After review, merge the branch

##

## 😁 Thanks to Our Contributors!

-   [Arrofi](https://github.com/Arropi)
-   [Matthew](https://github.com/Matthewhayunajipriantara)