# 1. Navigate to your new project
cd /home/finch/repos/artportfolio/

# 2. Initialize Git locally
git init
git add .
git commit -m "Initial commit: Ported art portfolio to vanilla stack"

# 3. Create the remote repo on GitHub and push immediately
# This command creates 'artportfolio' on your account, makes it public,
# sets 'origin' as the remote, and pushes your current code.
gh repo create artportfolio --public --source=. --remote=origin --push