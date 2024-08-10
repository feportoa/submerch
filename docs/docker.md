# Configuring files to use docker properly

Since the dev team has been having problems with version and things randomly exploding, we must start using docker to make sure everyone is using the same system configured the same way.
So here is a quick tutorial on how to set up the files to use the project inside docker properly:

- Inside app.js, row 19, change the string to `"0.0.0.0"`
- Inside your `psql-data.json`, change your host to `"host.docker.internal"`
- Set up your docker environment >
    - Create an image: docker build -t <your_image_name>:<your_image_tag> (image tag can be empty, just remove the semicolons :)
    - Run your image with VOLUMES: docker run -v "<your_path>":/app -p 8080:8080 <your_image_name>:<your_image_tag> (leave tag empty if your tag is latest or not declared before)
    - [!!!] If you are running docker with volumes, the image is using nodemon, which means you don't need to rerun the image every time you update something.

### Cheers!