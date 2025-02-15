# segfault

## Team Members

- takrim1999 (Team Leader)
- pronabpaul
- parthokr

## Mentor

- redwanuzzaman

## Project Description
**Codesirius**
Codesirius is a platform to arrange interview sessions with live coding. It is aimed to facilitate the interview process for both the interviewer and the interviewee.
It has also problem archive where users can practice problems and can see the solutions of the problems. Users can also submit their solutions and can see the results.

## Getting Started
### Using Docker
To spin up the project using Docker, follow the steps below:
0. Make sure you have Docker installed on your system. If not, you can download it from [here](https://docs.docker.com/get-docker/).
1. Clone the repository
2. Run the following commands
```bash
docker-compose up backend # To start the backend server
docker-compose up frontend # To start the frontend server
```
You can also run both the servers at once using the following command
```bash
docker-compose up
```

### Without Docker
TBD

### Sample .env file

```bash
DJANGO_DEBUG=<True/False>
DJANGO_LOG_LEVEL=<DEBUG/INFO/WARNING/ERROR/CRITICAL>
DB_HOST=<your-db-host>
DB_NAME=<fancy-db-name>
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>
DJANGO_SECRET_KEY=<your-secret-key>
BACKEND_URL=<nextjs-backend-url>
# Optional but requires manual configuration in settings.py
TAILSCALE_VPN_IP=<your-tailscale-ip> # only if you are using Tailscale
AZURE_VM_IP=<your-azure-vm-ip> # only if you are using Azure VM

```

## Development Guidelines

1. Create feature branches
2. Make small, focused commits
3. Write descriptive commit messages
4. Create pull requests for review

## Resources

- [Project Documentation](docs/)
- [Development Setup](docs/setup.md)
- [Contributing Guidelines](https://github.com/Learnathon-By-Geeky-Solutions/segfault/wiki/Contributing)
