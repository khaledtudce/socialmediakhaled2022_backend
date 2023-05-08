# socialmediakhaled2022_backend

This project is a part of project of SocialMediaKhaled20222 and here are the instruction of github CI/CD pipeline and how to configure automatically deploy this React backend part of the app to AWS EC2 instance using Ubuntu. The main idea is that the backend part is pulled from backend using git everytime there is any change happened and deployed to the aws instance. 

dev.yml file
```sh
name: dev Backend

on:
  push:
    branches:
      - dev

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x]

    steps:
      - uses: actions/checkout@v2
      - name: Use node js
        uses: actions/setup-node@v1
        with:
          node-version: ${{ matrix.node-version }}
      - name: npm install and build
        run: |
          npm install
          npm run build

        env:
          CI: true

  deploy:
    needs: [build]
    runs-on: ubuntu-latest

    steps:
      - name: SSH Deploy
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOSTDEV }}
          username: ${{ secrets.USERDEV }}
          key: ${{ secrets.KEYDEV }}
          port: ${{ secrets.PORTDEV }}
          script: |
            curl -o-   https://raw.githubusercontent.com/creationix/nvm/v0.39.1/install.sh | bash
            . ~/.nvm/nvm.sh

             nvm install 18
             npm install -g pm2
             cd /home/ubuntu/
             mkdir -p deploy/backend 
             cd deploy/backend
             git reset --hard HEAD
             git pull origin dev --rebase
             npm install
             npm run build
             cp -a /home/ubuntu/deploy/backend/public /home/ubuntu/deploy/backend/dist/
             pm2 restart api
```

## Backend CI/CD Configuration instructions

### 1. Need following libraries to install in the backend to deploy node js application: html-webpack-plugin, webpack, webpack-node-externals, webpack-cli
```sh
npm i html-webpack-plugin
npm i webpack
npm i webpack-node-externals
npm i webpack-cli
```

### 2. Create an aws instance using ubuntu and update ubuntu
```sh
sudo apt-get update
```

### 3. Open port 8800 under Security of AWS instance, protocol: TCP. Clicking on Security Groups will open a window where it is possible to edit inbound rules

### 4. Go to the security folder 
```sh
cd .ssh
```

### 5. Generate key using ssh-keygen
```sh
ssh-keygen -t ed25519 -a 200 -C "khaledreza@gmail.com" 
```

### 6. Copy this private key and put it to the Github Action Secrets for KEYDEV
```sh
cat id_ed25519
```

### 7. Provide rest of the github Action secrets, HOSTDEV=public ip address of the aws instance, USERDEV=ubuntu (default), PORTDEV=22 (default)

### 8. Copy id_ed25519.pub key to the authorized_keys, so that github's ssh request can be validated using this public key. Otherwise there will be handshake failure because key validation failure
```sh
cat id_ed25519.pub
sudo nano authorized_keys
```
Save it with Cntl + x, then press y and then press enter. When the build is run again, it should be able to connect with aws securely. 

### 9. To pick nvm package manager,
```sh
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.39.1/install.sh | bash
~/.nvm/nvm.sh
nvm -v # To see the nvm version
npm -v # To see npm version

In case you see this failure(-bash: /home/ubuntu/.nvm/nvm.sh: Permission denied) message, do following,
Copy & Past (each line separately)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
``` 

### 10. For only one time, install project manager pm2, 
```sh
nvm install 18 # probably was already installed from package manager installer
npm install -g pm2  
```

### 11. For only one time make the backend directory and initialize the git repository here, so that from the CI/CD, the updated code can be pulled easily. 
```sh
mkdir -p deploy/backend 
cd deploy/backend
git init # initialize repository
git remote add origin https://github.com/khaledtudce/socialmediakhaled2022_backend.git # add remote repository origin
git remote set-url origin https://github.com/khaledtudce/socialmediakhaled2022_backend.git # give access right
```

### 12. Start pm2 for the first time only from the folder where index.js and package.json are
```sh
pm2 start npm --name api -- run start:prod # start process (name it api) from current directory start:prod from package.json
```

### 13. Make sure that you have configured the starting script of package.json of backend server using following, so that the CI/CD can pick the backend application to run from current folder
```sh
"scripts": {
    "build": "webpack --mode development",
    "start": "nodemon index.js",
    "start:prod": "node dist/server.js"
  }
```

### 14. Need to manage .env file on AWS with following informations, this is a one time configuration (provide your database URL, our database is mongodb provided cloud service). This is untract file, that is why we need to provide it on our own to root directory of the project. 
```sh
.env file (untraced from git)

MONGO_URL = mongodb+srv://khaledtudce:Salmon.13@cluster0.c6jtzdo.mongodb.net/socialmediakhaled?retryWrites=true&w=majority
```

### 15. If index.js file has following, then i.e. http://54.146.140.24:8800/ of root page will show that message "Welcome to homepage 5", server will run on port 8800
```sh
app.get("/", (req, res) => {
  res.send("Welcome to homepage 5");
});

app.listen(8800, () => {
  console.log("Backend server is ready! ");
});
```

### 16. The backend is supposed to be running and can be seen under server public address i.e. 
```sh
http://54.146.140.24:8800/ # aws instance public address
Welcome to homepage 5 # should see this message on browser

http://54.146.140.24:8800/api/users/63acb2551958832863001bc4 # Server api can be accessed by this link
http://54.146.140.24:8800/images/person/1.jpeg # Server image can be accessed by this link
```

### 17. As our client and server are in different aws instance, we had to allow cors from server to avoid cors header problem.
```sh
npm i cors # install cors

const cors = require("cors"); # initialize in index.js file 

app.use(cors()); provide in index.js file 
app.options("*", cors());
```

### 18. Another way to deploy application is by putting frontend (after build) on backend's dist folder. In that case we do not need two aws instance and there will be no cors problem since both client and server are in same instance. In that case, server can be taken by git pull request and client will be picked after build from github. I will try later.

### 19. Some useful linux command for general use,

```sh
pm2 start npm --name api -- run start:prod # Using project manager, run process from the current folder described in start:prod and name it api
pm2 logs  # show live server logs
pm2 list # List all service running in pm2
pm2 stop api # stop process named api
pm2 delete api # kill process named api

cd # will bring the location to initial place of aws
Cntl + Delete # will delete faster
cp -a /home/ubuntu/deploy/socket/socialmediakhaled2022_socket/. /home/ubuntu/deploy/socket/ # Copy all files of a folder to another file
rm -R socialmediakhaled2022_socket # Remove File with folder 
pwd # show the path of current directory
Cntl + shift + p  # paste copied item
```
