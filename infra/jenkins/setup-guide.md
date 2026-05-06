# Jenkins Setup Guide for MyIonio

This guide covers setting up a local Jenkins instance to orchestrate the CI/CD pipeline for the MyIonio monorepo.

## 1. Initial Installation
If you haven't installed Jenkins yet, the easiest way is via Docker:

```bash
docker run -d -p 8080:8080 -p 50000:50000 \
  -v jenkins_home:/var/jenkins_home \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name jenkins jenkins/jenkins:lts
```

## 2. Unlocking Jenkins
1. Browse to `http://localhost:8080`.
2. Retrieve the initial admin password:
   - **Docker**: `docker logs jenkins`
   - **Windows Installer**: Look at `C:\ProgramData\Jenkins\.jenkins\secrets\initialAdminPassword`
3. Install **suggested plugins**.

## 3. Required Plugins
Ensure the following are installed via **Manage Jenkins > Plugins**:
- **Pipeline**
- **GitHub Integration**
- **Docker Pipeline** (Required for `docker.build` steps)
- **SSH Agent** (Required for `sshagent` steps)

## 4. Configuration of Credentials
Navigate to **Manage Jenkins > Credentials > System > Global credentials**.

### `github-token` (Username with password)
- **Username**: Your GitHub username.
- **Password**: GitHub Personal Access Token (PAT).
  - *Permissions needed: `repo`, `write:packages`.*
- **ID**: `github-token` (Matches `Jenkinsfile`).

### `vps-ssh-creds` (SSH Username with private key)
- **Username**: `ubuntu` (or your VPS username).
- **Private Key**: Paste the private key used to access your VPS.
- **ID**: `vps-ssh-creds` (Matches `Jenkinsfile`).

## 5. Creating the Pipeline
1. **New Item** > `MyIonio-CI-CD` > **Pipeline**.
2. **Pipeline Section**:
   - **Definition**: Pipeline script from SCM.
   - **SCM**: Git.
   - **Repository URL**: `https://github.com/OdysseasKalaitsidis/MyIonio_MonoRepo.git` (or local path).
   - **Credentials**: Select your `github-token`.
   - **Branch Specifier**: `*/master` (or your main branch).
   - **Script Path**: `Jenkinsfile`.
3. **Save** and **Build Now**.

## 6. Troubleshooting
- **Docker Errors**: Ensure the Jenkins user has permission to use Docker (`sudo usermod -aG docker jenkins` inside the container if using Docker-in-Docker).
- **SSH Errors**: Ensure the VPS allows SSH connections from your IP and the key is correctly added to `~/.ssh/authorized_keys` on the VPS.
