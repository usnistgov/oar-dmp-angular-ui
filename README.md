# NIST Data Management Pan User Interface

The Data Management Planning Component provides a tool that allows a NIST researcher to plan out how data will managed throughout the lifecycle of a research project.

### Build Status
This is a testing build that interacts with a Python API which queries a MongoDB instance

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.2.6.

#### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

#### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

#### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

#### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

#### Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

### Building and Testing Using Native Tools

The `npm` tool can be used in the standard way for [Angular projects](https://angular.io/docs) to
build and test this software.

Detail commands and instructions:

1. Clone this repository and update Angular library
    
    After clone the repository, do the following:
    
```
    cd oar-dmp-angular-ui
    git checkout oar-dmp-submodules
    git submodule update --init --recursive
    cd lib
    git checkout integration
```

Now lib folder should have the latest code of oar-lib-angular.
    
2. Install packages

    Go to root folder, switch to initial-portal-setup02 branch, then do npm install:
    
```    
    Note: make sure your npm version is 7.0.0 or higher. Use npm -v to check your version. 
    If not, run npm install -g npm@latest.
    
    cd ..
    npm i 
```    
    
4. Build the Angular library 

```
    npm run build-lib
```
    
3. Build and run your application

    
```    
    npm run build-oardmp
    npm run start build-oardmp
```

4. Testing your app

```
    Browse: http://localhost:4201
```

#### Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Repository Administration
### Contacts

The administrators of this repository include:

  * Niksa Blonder (niksa.blonder@nist.gov)
  * Gretchen Greene (gretchen.greene@nist.gov)
  * Ray Plante (raymond.plante@nist.gov)
  * Christopher David (christopher.davis@nist.gov)

