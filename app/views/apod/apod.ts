import { EventData, PropertyChangeData } from "data/observable";
import { Button } from "ui/button";
import { Image } from "ui/image";
import { GestureTypes, GestureEventData, SwipeGestureEventData } from "ui/gestures";
import { GridLayout } from "ui/layouts/grid-layout";
import { ListView } from "ui/list-view";
import { Page } from "ui/page";
import { ScrollView } from "ui/scroll-view";
import { StackLayout } from "ui/layouts/stack-layout";
import { topmost } from "ui/frame";

import application = require("application");
import color = require("color");
import dialogs = require("ui/dialogs");
import enums = require("ui/enums");
import fileSystem = require("file-system");
import imageSource = require("image-source");
import platformModule = require("platform");
import * as utils from 'utils/utils';

import { ApodViewModel, ApodItem } from "../../models/apod/apod-model";

var permissions = require( "nativescript-permissions");
import drawerModule = require("nativescript-telerik-ui/sidedrawer");
import { FrescoDrawee, FinalEventData } from "nativescript-fresco";
import * as SocialShare from "nativescript-social-share";
 
let apodViewModel = new ApodViewModel();
apodViewModel.set("isItemVisible", true);

let page;

let shareButtonAndroid;
let saveButtonAndroid;
let desktopButtonAndroid;

let shareButtonIOS;
let iosImage;

let currentImage: imageSource.ImageSource;
var currentSavedPath;

export function onPageLoaded(args: EventData) {
    page = <Page>args.object;

    if (application.android) {
        shareButtonAndroid = <Button>page.getViewById("btn-share");
        saveButtonAndroid = <Button>page.getViewById("btn-save");
        desktopButtonAndroid = <Button>page.getViewById("btn-desktop");

        permissions.requestPermission("android.permission.WRITE_EXTERNAL_STORAGE", "I need these permissions")
            .then(function() {
                console.log("Permissions granted!");
            })
            .catch(function() {
                console.log("Uh oh, no permissions - plan B time!");
        });

        shareButtonAndroid.on("tap", function (args: GestureEventData)  {
            SocialShare.shareImage(currentImage, "NASA APOD");
        })

        saveButtonAndroid.on("tap", function (args: GestureEventData)  {
            saveFile(currentImage);

            var options = {
                title: "Photo Downloaded!",
                message: "APOD Image successfully saved in /Downloads/CosmosDataBank!",
                okButtonText: "OK"
            };
            dialogs.alert(options).then(() => {
                console.log("APOD Image successfully saved in /Downloads/CosmosDataBank");
            });
        })

        desktopButtonAndroid.on("tap", function (args: GestureEventData) {
            saveFile(currentImage);

            var wallpaperManager = android.app.WallpaperManager.getInstance(utils.ad.getApplicationContext());
            try {
                var imageToSet = imageSource.fromFile(currentSavedPath);
                wallpaperManager.setBitmap(imageToSet.android);
            } catch (error) {
                console.log(error);
            }

        })

        saveButtonAndroid.opacity = 0.2;
        desktopButtonAndroid.opacity = 0.2;
        shareButtonAndroid.opacity = 0.2
    }

    if (application.ios) {
        shareButtonIOS = <Button>page.getViewById("btn-share-ios");
        iosImage = <Image>page.getViewById("ios-image");

        shareButtonIOS.on("tap", function (args: GestureEventData)  {
            console.log("Android share tapped!");
            SocialShare.shareImage(currentImage, "NASA APOD");
        })
    }
}

export function onScrollSwipe(args: SwipeGestureEventData) {
    if (args.direction === 1) {
        previousDate();
    } else if (args.direction === 2) {
        nextDate();
    }   
}

export function onPageNavigatedTo(args: EventData) {
    page = <Page>args.object;
    var pageContainer = <StackLayout>page.getViewById("pageContainer");

    if (!apodViewModel.get("dataItem")) {
        apodViewModel.initDataItems();
    }

    pageContainer.bindingContext = apodViewModel;
}

export function previousDate() {
    saveButtonAndroid.opacity = 0.2;
    desktopButtonAndroid.opacity = 0.2;
    shareButtonAndroid.opacity = 0.2;

    // add check if the date is not too far in the past (check first APOD date)
    var currentDate = apodViewModel.get("selectedDate");
    currentDate.setDate(currentDate.getDate()-1);
    apodViewModel.set("selectedDate", currentDate);
    apodViewModel.initDataItems(formatDate(currentDate)); 
}

export function nextDate() {
    saveButtonAndroid.opacity = 0.2;
    desktopButtonAndroid.opacity = 0.2;
    shareButtonAndroid.opacity = 0.2

    var currentDate = apodViewModel.get("selectedDate");
    if (currentDate >= new Date()) {
        var options = {
            title: "Error!",
            message: "We can't show photos from the future! ;)",
            okButtonText: "OK"
        };
        dialogs.alert(options).then(() => {
            console.log("Future alert dismissed!");
        });
    } else {
        currentDate.setDate(currentDate.getDate()+1);
        apodViewModel.set("selectedDate", currentDate);
        apodViewModel.initDataItems(formatDate(currentDate)); 
    }

}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

export function onSubmit(args: EventData) {
    console.log("media_type: " + apodViewModel.get("dataItem").media_type);

    var mediaType = apodViewModel.get("dataItem").media_type;
    if (mediaType === "video") {
        // player for youtube?
    }
}

export function onFinalImageSet(args: FinalEventData) {
    var drawee = args.object as FrescoDrawee;

    imageSource.fromUrl(drawee.imageUri)
        .then(function (res: imageSource.ImageSource) {
            currentImage = res;
            
            saveButtonAndroid.animate({opacity: 0.2,rotate: 360})
            .then( function () { return saveButtonAndroid.animate({opacity: 0.5,rotate: 180, duration: 150 }); })
            .then( function () { return saveButtonAndroid.animate({opacity: 1.0, rotate: 0, duration: 150 }); });

            desktopButtonAndroid.animate({opacity: 0.2,rotate: 360})
            .then( function () { return desktopButtonAndroid.animate({opacity: 0.5,rotate: 180, duration: 150 }); })
            .then( function () { return desktopButtonAndroid.animate({opacity: 1.0, rotate: 0, duration: 150 }); });

            shareButtonAndroid.animate({opacity: 0.2,rotate: 360})
            .then( function () { return shareButtonAndroid.animate({opacity: 0.5,rotate: 180, duration: 150 }); })
            .then( function () { return shareButtonAndroid.animate({opacity: 1.0, rotate: 0, duration: 150 }); });
        }, function (error) {
            // console.log("Error loading image: " + error);
    })   
}

export function saveFile(res: imageSource.ImageSource) {

    // try-catch HERE to endsure you have res!!!
    var url = apodViewModel.get("dataItem").url;
    console.log(url);

    // var fileName = url.substring(url.lastIndexOf("/") + 1);
    // var n = fileName.indexOf('.');
    // fileName = fileName.substring(0, n != -1 ? n : fileName.length) + ".jpeg"; // test this

    //  THIS SHOULD BE ON FINAL IMAGE SET - OTHERWISE APP CRASHES if user try to save to early!!!!s
    var fileName = "CosmosDB" + new Date().getDate().toString() + "-" + new Date().getTime().toString() + ".jpeg";
    var androidDownloadsPath = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS).toString();  
    var cosmosFolderPath = fileSystem.path.join(androidDownloadsPath, "CosmosDataBank");
    var folder = fileSystem.Folder.fromPath(cosmosFolderPath);

    var path = fileSystem.path.join(cosmosFolderPath, fileName);
    var saved = res.saveToFile(path, enums.ImageFormat.jpeg);

    currentSavedPath = path;
}

export function onIosShare() {
    
    imageSource.fromUrl(iosImage.src)
        .then(function (res: imageSource.ImageSource) {           
            SocialShare.shareImage(res);
        }, function (error) {
            // console.log("Error loading image: " + error);
    });    
}

export function onIosStackLoaded() {
    console.log("onIosImageLoaded");
}