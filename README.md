# OptiNetSim frontend

🚧 WIP: The project is currently in development; some features may be unavailable.

OptiNetSim is a front-end project for an optical network simulation platform, developed based on the Vitesse template. It provides functionalities such as optical network topology editing, device configuration, and single link simulation. This front-end project works in conjunction with back-end services to offer users an intuitive visual interface for optical network simulation.

## Requirement

> Vitesse requires Node >=14.18

## Usage

### Development

Just run and visit http://localhost:3333

```bash
pnpm dev
```

### Build

To build the App, run

```bash
pnpm build
```

And you will see the generated file in `dist` that ready to be served.

### Docker Production Build

First, build the vitesse image by opening the terminal in the project's root directory.

```bash
docker buildx build . -t vitesse:latest
```

Run the image and specify port mapping with the `-p` flag.

```bash
docker run --rm -it -p 8080:80 vitesse:latest
```
