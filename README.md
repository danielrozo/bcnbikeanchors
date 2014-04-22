##Barcelona bike parkings##

At the moment it's a very simple Apache Cordova app with Google Maps. This app allows you to find public bike parkings in Barcelona and trace routes to them.

Any pull requests will be welcomed, specially regarding JS improvement. Got ideas to implement? Drop a message or a PR.

##Installation

After you've cloned this repo, you'll need to run this commands in order to get everything working, inside the repo's folder:

    mkdir platforms
    mkdir plugins
    cordova plugin add apache.org.cordova.network-information
    cordova plugin add apache.org.cordova.geolocation

Then you'll be able to add any platform you like, for example:

    cordova platform add wp8
    cordova platform add android

And then build/deploy to your phone:

    cordova run android