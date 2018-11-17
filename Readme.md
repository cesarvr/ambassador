## Example Ambassador Container 

### How to deploy 

To deploy this project in OpenShift you just need to execute ``oc new-build``:


```sh 
oc new-build nodejs~https://github.com/cesarvr/ambassador --name=decorator
```

Doing this will create a image, with this process. Next step is to choose the service you want to override.





