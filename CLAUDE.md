# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static art portfolio website for "Bred", a digital artist taking commissions. The site is generated via a bash script rather than maintained as traditional source files.

## Build Commands

```bash
# Generate the entire website (HTML, CSS, JS, and assets)
./scaffold_portfolio.sh

# Initialize git repo and push to GitHub
./pro_git.sh
```

## Architecture

This project uses a **script-based generation pattern** where the website is a generated artifact:

- **scaffold_portfolio.sh** - The main build script that:
  - Copies and renames image assets from a source directory (`/home/finch/Downloads/aaaaa`)
  - Generates `index.html`, `style.css`, and `script.js` using heredocs
  - All website content is defined inline within this script

- **pro_git.sh** - Git workflow script for initial repository setup and push to GitHub

**Generated output** (created by scaffold_portfolio.sh):
- `index.html` - Single-page portfolio with gallery, pricing, and TOS sections
- `style.css` - Dark theme styling with CSS variables
- `script.js` - Lightbox gallery and Discord username copy functionality
- `assets/` - Renamed image files

## Tech Stack

- Vanilla HTML5/CSS3/JavaScript (no frameworks or build tools)
- CSS Grid for responsive layouts
- Dark theme with pink accent (`#ff9ebc`)

## Key Patterns

When modifying the website, edit the heredoc content within `scaffold_portfolio.sh`, not the generated files directly. The generated files will be overwritten on the next scaffold run.
