<div align="center">
<h1 align="center">Git Fixed-It</h1>
<p align="center">
<strong>An AI powered cli to generate/automate (better) git commit messages.</strong>
<br />
<br />
</p>
<span style="margin-top: 10px; width: 4rem; margin-right: 0.5rem;"><img alt="Static Badge" src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=%23ffffff&logoSize=auto"></span>
<span style="margin-top: 10px; width: 4rem; margin-right: 0.5rem;"><img alt="Static Badge" src="https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=%23ffffff&logoSize=auto"></span>
<span style="margin-top: 10px; width: 4rem; margin-right: 0.5rem;"><img alt="Static Badge" src="https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=%23ffffff&logoSize=auto"></span>
<span style="margin-top: 10px; width: 4rem; margin-right: 0.5rem;"><img alt="Static Badge" src="https://img.shields.io/badge/Gemini-8E75B2?style=flat&logo=googlegemini&logoColor=%23ffffff&logoSize=auto"></span>
<br />
</div>

-----

Testing something

```gitfi``` is a simple command-line tool that uses Google's Gemini to automatically generate a descriptive commit message based on your staged Git changes.

## Installation

```bash
npm install -g gitfi
```

## Configuration

Before you can use ```gitfi```, you need to provide your Gemini API key. The tool will look for the key in the following order:

1.  A `.env` file in your project's root (`GEMINI_API_KEY=...`).
2.  A global config file at `~/.config/gitfi/.gitfi.conf` (Linux) or `~/Library/Preferences/gitfi/.gitfi.conf` (macOS).
3.  A local `.gitfi.conf` file in your project's root.

Your config file can contain any of these settings:

```ini
# Your Gemini API Key (required)
GEMINI_API_KEY=your_secret_api_key_here

# Optional: Specify a different Gemini model
GEMINI_MODEL=gemini-2.0-flash

# Optional: Provide a completely custom prompt.
PROMPT=You are a pirate. Write a commit message for this treasure map:
```

*Note: The `.env` file uses the same variable names.*

## Usage

After staging your files with `git add`, you have two ways to use `gitfi`.

#### Interactive Mode (For when you're feeling cautious)

Run the `gen` command to have the AI generate a message and present you with options to commit, edit, or cancel.

```bash
gitfi gen

# or the alias
gitfi g
```

#### Direct Commit Mode (For when you're feeling confident)

Run the `commit` command to have the AI generate a message and commit the changes instantly.

```bash
gitfi commit

# or the alias
gitfi c
```
