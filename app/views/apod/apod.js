"use strict";
var application = require("application");
var imageSource = require("image-source");
var utils = require("utils/utils");
var SocialShare = require("nativescript-social-share");
var youtubeHelpers = require("../helpers/youtube/youtube-helpers");
var formatters = require("../helpers/formaters");
var file_helpers_1 = require("../helpers/files/file-helpers");
var firebase_1 = require("../helpers/firebase/firebase");
if (application.android) {
    var toast = require("nativescript-toast");
    var youtube = require("nativescript-youtube-player");
}
var credentials_1 = require("../../files/credentials");
var apod_model_1 = require("../../view-models/apod/apod-model");
var apodViewModel = new apod_model_1.ApodViewModel();
apodViewModel.set("isPlayerVisible", false);
apodViewModel.set("youtube_api_key", credentials_1.YOUTUBE_API_KEY);
apodViewModel.set("youtube_video_key", "2zNSgSzhBfM");
var page;
var shareButton;
var saveButton;
var desktopButton;
var iosImage;
var currentImage;
var currentSavedPath;
var player;
function onPageLoaded(args) {
    page = args.object;
}
exports.onPageLoaded = onPageLoaded;
function onScrollSwipe(args) {
    if (args.direction === 1) {
        previousDate();
    }
    else if (args.direction === 2) {
        nextDate();
    }
}
exports.onScrollSwipe = onScrollSwipe;
function onPageNavigatedTo(args) {
    page = args.object;
    shareButton = page.getViewById("btn-shar");
    saveButton = page.getViewById("btn-save");
    desktopButton = page.getViewById("btn-desk");
    if (application.android) {
        player = page.getViewById("player");
        file_helpers_1.setButtonsOpacity(shareButton, saveButton, desktopButton, 0.2);
        file_helpers_1.setUserInteraction(shareButton, saveButton, desktopButton, false);
    }
    if (application.ios) {
        iosImage = page.getViewById("ios-image");
    }
    if (!apodViewModel.get("dataItem")) {
        apodViewModel.initDataItems().then(function (res) {
            console.log(apodViewModel.get("dataItem").media_type === "video");
            if (application.android && (apodViewModel.get("dataItem").media_type === "video")) {
                initPlayer();
            }
            else {
                player.pause();
                apodViewModel.set("isPlayerVisible", false);
            }
        });
    }
    page.bindingContext = apodViewModel;
}
exports.onPageNavigatedTo = onPageNavigatedTo;
function previousDate() {
    if (application.android) {
        file_helpers_1.setButtonsOpacity(shareButton, saveButton, desktopButton, 0.2);
        file_helpers_1.setUserInteraction(shareButton, saveButton, desktopButton, false);
    }
    // TODO: add check if the date is not too far in the past (check first APOD date)
    var currentDate = apodViewModel.get("selectedDate");
    currentDate.setDate(currentDate.getDate() - 1);
    apodViewModel.set("selectedDate", currentDate);
    apodViewModel.initDataItems(formatters.formatDate(currentDate)).then(function (res) {
        if (application.android && (apodViewModel.get("dataItem").media_type === "video")) {
            initPlayer();
        }
        else {
            player.pause();
            apodViewModel.set("isPlayerVisible", false);
        }
    });
}
exports.previousDate = previousDate;
function nextDate() {
    if (application.android) {
        file_helpers_1.setButtonsOpacity(shareButton, saveButton, desktopButton, 0.2);
        file_helpers_1.setUserInteraction(shareButton, saveButton, desktopButton, false);
    }
    var currentDate = apodViewModel.get("selectedDate");
    if (currentDate >= new Date()) {
        if (application.android) {
            toast.makeText("Can not load photos from the future!").show();
        }
    }
    else {
        currentDate.setDate(currentDate.getDate() + 1);
        apodViewModel.set("selectedDate", currentDate);
        apodViewModel.initDataItems(formatters.formatDate(currentDate)).then(function (res) {
            if (application.android && (apodViewModel.get("dataItem").media_type === "video")) {
                initPlayer();
            }
            else {
                player.pause();
                apodViewModel.set("isPlayerVisible", false);
            }
        });
    }
}
exports.nextDate = nextDate;
function onFinalImageSet(args) {
    var drawee = args.object;
    currentImage = file_helpers_1.setCurrentImage(drawee.imageUri);
    saveButton.animate({ opacity: 0.2, rotate: 360 })
        .then(function () { return saveButton.animate({ opacity: 0.5, rotate: 180, duration: 150 }); })
        .then(function () { return saveButton.animate({ opacity: 1.0, rotate: 0, duration: 150 }); });
    desktopButton.animate({ opacity: 0.2, rotate: 360 })
        .then(function () { return desktopButton.animate({ opacity: 0.5, rotate: 180, duration: 150 }); })
        .then(function () { return desktopButton.animate({ opacity: 1.0, rotate: 0, duration: 150 }); });
    shareButton.animate({ opacity: 0.2, rotate: 360 })
        .then(function () { return shareButton.animate({ opacity: 0.5, rotate: 180, duration: 150 }); })
        .then(function () { return shareButton.animate({ opacity: 1.0, rotate: 0, duration: 150 }); })
        .then(function () { file_helpers_1.setUserInteraction(shareButton, saveButton, desktopButton, true); });
}
exports.onFinalImageSet = onFinalImageSet;
function onSaveImage(args) {
    if (application.ios) {
        imageSource.fromUrl(iosImage.src)
            .then(function (res) {
            file_helpers_1.saveFile(res, apodViewModel.get("dataItem").url, currentSavedPath);
        }).catch(function (err) {
            console.log(err);
        });
    }
    else if (application.android) {
        file_helpers_1.saveFile(currentImage, apodViewModel.get("dataItem").url, currentSavedPath);
        toast.makeText("Photo saved in /Downloads/CosmosDataBank/").show();
    }
}
exports.onSaveImage = onSaveImage;
function onSetWallpaper(args) {
    if (application.ios) {
        imageSource.fromUrl(iosImage.src)
            .then(function (res) {
            currentImage = res; // TODO : set wallpaper for iOS
        }).catch(function (err) {
            console.log(err);
        });
        ;
    }
    else if (application.android) {
        file_helpers_1.saveFile(currentImage, apodViewModel.get("dataItem").url, currentSavedPath);
        var wallpaperManager = android.app.WallpaperManager.getInstance(utils.ad.getApplicationContext());
        try {
            var imageToSet = imageSource.fromFile(currentSavedPath);
            wallpaperManager.setBitmap(imageToSet.android);
        }
        catch (error) {
            console.log(error);
        }
        toast.makeText("Wallpaper Set!").show();
    }
}
exports.onSetWallpaper = onSetWallpaper;
function onShare(args) {
    firebase_1.firebasePush(apodViewModel.get("dataItem"));
    if (application.android) {
        SocialShare.shareImage(currentImage, "NASA APOD");
    }
    else if (application.ios) {
        imageSource.fromUrl(iosImage.src)
            .then(function (res) {
            SocialShare.shareImage(res);
        }).catch(function (err) {
            console.log(err);
        });
    }
}
exports.onShare = onShare;
function initPlayer() {
    var mediaUrl = apodViewModel.get("dataItem").url;
    if (mediaUrl.indexOf("youtube") >= 0) {
        apodViewModel.set("isPlayerVisible", true);
        var youtubeID = youtubeHelpers.getYouTubeID(mediaUrl);
        player.loadVideo(youtubeID, 10); // pass the actual video here or load web-view
        player.play();
    }
    else {
        player.pause();
        apodViewModel.set("isPlayerVisible", false);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBvZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFwb2QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUtBLHlDQUE0QztBQUM1QywwQ0FBNkM7QUFDN0MsbUNBQXFDO0FBR3JDLHVEQUF5RDtBQUV6RCxtRUFBcUU7QUFDckUsaURBQW1EO0FBQ25ELDhEQUFpSDtBQUNqSCx5REFBNEQ7QUFFNUQsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDdEIsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDMUMsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLDZCQUE2QixDQUFDLENBQUM7QUFDekQsQ0FBQztBQUVELHVEQUEwRDtBQUMxRCxnRUFBa0U7QUFFbEUsSUFBSSxhQUFhLEdBQUcsSUFBSSwwQkFBYSxFQUFFLENBQUM7QUFDeEMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUM1QyxhQUFhLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLDZCQUFlLENBQUMsQ0FBQztBQUN0RCxhQUFhLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBRXRELElBQUksSUFBVSxDQUFDO0FBQ2YsSUFBSSxXQUFtQixDQUFDO0FBQ3hCLElBQUksVUFBa0IsQ0FBQztBQUN2QixJQUFJLGFBQXFCLENBQUM7QUFDMUIsSUFBSSxRQUFlLENBQUM7QUFDcEIsSUFBSSxZQUFxQyxDQUFDO0FBRTFDLElBQUksZ0JBQXdCLENBQUM7QUFDN0IsSUFBSSxNQUFNLENBQUM7QUFFWCxzQkFBNkIsSUFBZTtJQUN4QyxJQUFJLEdBQVMsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUM3QixDQUFDO0FBRkQsb0NBRUM7QUFFRCx1QkFBOEIsSUFBMkI7SUFDckQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxDQUFDLENBQUMsQ0FB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UUFBUSxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDO0lBRWpELEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQyxhQUFhLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzNDLElBQUksU0FBUyxHQUFHLGNBQWMsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEQsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyw4Q0FBOEM7UUFDL0UsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUNKLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNmLGFBQWEsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEQsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFdmVudERhdGEgfSBmcm9tIFwiZGF0YS9vYnNlcnZhYmxlXCI7XHJcbmltcG9ydCB7IEJ1dHRvbiB9IGZyb20gXCJ1aS9idXR0b25cIjtcclxuaW1wb3J0IHsgSW1hZ2UgfSBmcm9tIFwidWkvaW1hZ2VcIjtcclxuaW1wb3J0IHsgR2VzdHVyZVR5cGVzLCBTd2lwZUdlc3R1cmVFdmVudERhdGEgfSBmcm9tIFwidWkvZ2VzdHVyZXNcIjtcclxuaW1wb3J0IHsgUGFnZSB9IGZyb20gXCJ1aS9wYWdlXCI7XHJcbmltcG9ydCBhcHBsaWNhdGlvbiA9IHJlcXVpcmUoXCJhcHBsaWNhdGlvblwiKTtcclxuaW1wb3J0IGltYWdlU291cmNlID0gcmVxdWlyZShcImltYWdlLXNvdXJjZVwiKTtcclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSBcInV0aWxzL3V0aWxzXCI7XHJcblxyXG5pbXBvcnQgeyBGcmVzY29EcmF3ZWUsIEZpbmFsRXZlbnREYXRhIH0gZnJvbSBcIm5hdGl2ZXNjcmlwdC1mcmVzY29cIjtcclxuaW1wb3J0ICogYXMgU29jaWFsU2hhcmUgZnJvbSBcIm5hdGl2ZXNjcmlwdC1zb2NpYWwtc2hhcmVcIjtcclxuXHJcbmltcG9ydCAqIGFzIHlvdXR1YmVIZWxwZXJzIGZyb20gXCIuLi9oZWxwZXJzL3lvdXR1YmUveW91dHViZS1oZWxwZXJzXCI7XHJcbmltcG9ydCAqIGFzIGZvcm1hdHRlcnMgZnJvbSBcIi4uL2hlbHBlcnMvZm9ybWF0ZXJzXCI7XHJcbmltcG9ydCB7IHNhdmVGaWxlLCBzZXRCdXR0b25zT3BhY2l0eSwgc2V0VXNlckludGVyYWN0aW9uLCBzZXRDdXJyZW50SW1hZ2UgfSBmcm9tIFwiLi4vaGVscGVycy9maWxlcy9maWxlLWhlbHBlcnNcIjtcclxuaW1wb3J0IHsgZmlyZWJhc2VQdXNoIH0gZnJvbSBcIi4uL2hlbHBlcnMvZmlyZWJhc2UvZmlyZWJhc2VcIjtcclxuXHJcbmlmIChhcHBsaWNhdGlvbi5hbmRyb2lkKSB7XHJcbiAgICB2YXIgdG9hc3QgPSByZXF1aXJlKFwibmF0aXZlc2NyaXB0LXRvYXN0XCIpO1xyXG4gICAgdmFyIHlvdXR1YmUgPSByZXF1aXJlKFwibmF0aXZlc2NyaXB0LXlvdXR1YmUtcGxheWVyXCIpO1xyXG59XHJcblxyXG5pbXBvcnQgeyBZT1VUVUJFX0FQSV9LRVkgfSBmcm9tIFwiLi4vLi4vZmlsZXMvY3JlZGVudGlhbHNcIjtcclxuaW1wb3J0IHsgQXBvZFZpZXdNb2RlbCB9IGZyb20gXCIuLi8uLi92aWV3LW1vZGVscy9hcG9kL2Fwb2QtbW9kZWxcIjtcclxuXHJcbmxldCBhcG9kVmlld01vZGVsID0gbmV3IEFwb2RWaWV3TW9kZWwoKTtcclxuYXBvZFZpZXdNb2RlbC5zZXQoXCJpc1BsYXllclZpc2libGVcIiwgZmFsc2UpO1xyXG5hcG9kVmlld01vZGVsLnNldChcInlvdXR1YmVfYXBpX2tleVwiLCBZT1VUVUJFX0FQSV9LRVkpO1xyXG5hcG9kVmlld01vZGVsLnNldChcInlvdXR1YmVfdmlkZW9fa2V5XCIsIFwiMnpOU2dTemhCZk1cIik7XHJcblxyXG5sZXQgcGFnZTogUGFnZTtcclxubGV0IHNoYXJlQnV0dG9uOiBCdXR0b247XHJcbmxldCBzYXZlQnV0dG9uOiBCdXR0b247XHJcbmxldCBkZXNrdG9wQnV0dG9uOiBCdXR0b247XHJcbmxldCBpb3NJbWFnZTogSW1hZ2U7XHJcbmxldCBjdXJyZW50SW1hZ2U6IGltYWdlU291cmNlLkltYWdlU291cmNlO1xyXG5cclxudmFyIGN1cnJlbnRTYXZlZFBhdGg6IHN0cmluZztcclxubGV0IHBsYXllcjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBvblBhZ2VMb2FkZWQoYXJnczogRXZlbnREYXRhKSB7XHJcbiAgICBwYWdlID0gPFBhZ2U+YXJncy5vYmplY3Q7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBvblNjcm9sbFN3aXBlKGFyZ3M6IFN3aXBlR2VzdHVyZUV2ZW50RGF0YSkge1xyXG4gICAgaWYgKGFyZ3MuZGlyZWN0aW9uID09PSAxKSB7XHJcbiAgICAgICAgcHJldmlvdXNEYXRlKCk7XHJcbiAgICB9IGVsc2UgaWYgKGFyZ3MuZGlyZWN0aW9uID09PSAyKSB7XHJcbiAgICAgICAgbmV4dERhdGUoKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG9uUGFnZU5hdmlnYXRlZFRvKGFyZ3M6IEV2ZW50RGF0YSkge1xyXG4gICAgcGFnZSA9IDxQYWdlPmFyZ3Mub2JqZWN0O1xyXG5cclxuICAgIHNoYXJlQnV0dG9uID0gPEJ1dHRvbj5wYWdlLmdldFZpZXdCeUlkKFwiYnRuLXNoYXJcIik7XHJcbiAgICBzYXZlQnV0dG9uID0gPEJ1dHRvbj5wYWdlLmdldFZpZXdCeUlkKFwiYnRuLXNhdmVcIik7XHJcbiAgICBkZXNrdG9wQnV0dG9uID0gPEJ1dHRvbj5wYWdlLmdldFZpZXdCeUlkKFwiYnRuLWRlc2tcIik7XHJcblxyXG4gICAgaWYgKGFwcGxpY2F0aW9uLmFuZHJvaWQpIHtcclxuICAgICAgICBwbGF5ZXIgPSBwYWdlLmdldFZpZXdCeUlkKFwicGxheWVyXCIpO1xyXG4gICAgICAgIHNldEJ1dHRvbnNPcGFjaXR5KHNoYXJlQnV0dG9uLCBzYXZlQnV0dG9uLCBkZXNrdG9wQnV0dG9uLCAwLjIpO1xyXG4gICAgICAgIHNldFVzZXJJbnRlcmFjdGlvbihzaGFyZUJ1dHRvbiwgc2F2ZUJ1dHRvbiwgZGVza3RvcEJ1dHRvbiwgZmFsc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChhcHBsaWNhdGlvbi5pb3MpIHtcclxuICAgICAgICBpb3NJbWFnZSA9IDxJbWFnZT5wYWdlLmdldFZpZXdCeUlkKFwiaW9zLWltYWdlXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghYXBvZFZpZXdNb2RlbC5nZXQoXCJkYXRhSXRlbVwiKSkge1xyXG4gICAgICAgIGFwb2RWaWV3TW9kZWwuaW5pdERhdGFJdGVtcygpLnRoZW4ocmVzID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYXBvZFZpZXdNb2RlbC5nZXQoXCJkYXRhSXRlbVwiKS5tZWRpYV90eXBlID09PSBcInZpZGVvXCIpO1xyXG4gICAgICAgICAgICBpZiAoYXBwbGljYXRpb24uYW5kcm9pZCAmJiAoYXBvZFZpZXdNb2RlbC5nZXQoXCJkYXRhSXRlbVwiKS5tZWRpYV90eXBlID09PSBcInZpZGVvXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBpbml0UGxheWVyKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwbGF5ZXIucGF1c2UoKTtcclxuICAgICAgICAgICAgICAgIGFwb2RWaWV3TW9kZWwuc2V0KFwiaXNQbGF5ZXJWaXNpYmxlXCIsIGZhbHNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHBhZ2UuYmluZGluZ0NvbnRleHQgPSBhcG9kVmlld01vZGVsO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcHJldmlvdXNEYXRlKCkge1xyXG4gICAgaWYgKGFwcGxpY2F0aW9uLmFuZHJvaWQpIHtcclxuICAgICAgICBzZXRCdXR0b25zT3BhY2l0eShzaGFyZUJ1dHRvbiwgc2F2ZUJ1dHRvbiwgZGVza3RvcEJ1dHRvbiwgMC4yKTtcclxuICAgICAgICBzZXRVc2VySW50ZXJhY3Rpb24oc2hhcmVCdXR0b24sIHNhdmVCdXR0b24sIGRlc2t0b3BCdXR0b24sIGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUT0RPOiBhZGQgY2hlY2sgaWYgdGhlIGRhdGUgaXMgbm90IHRvbyBmYXIgaW4gdGhlIHBhc3QgKGNoZWNrIGZpcnN0IEFQT0QgZGF0ZSlcclxuICAgIHZhciBjdXJyZW50RGF0ZSA9IGFwb2RWaWV3TW9kZWwuZ2V0KFwic2VsZWN0ZWREYXRlXCIpO1xyXG4gICAgY3VycmVudERhdGUuc2V0RGF0ZShjdXJyZW50RGF0ZS5nZXREYXRlKCkgLSAxKTtcclxuICAgIGFwb2RWaWV3TW9kZWwuc2V0KFwic2VsZWN0ZWREYXRlXCIsIGN1cnJlbnREYXRlKTtcclxuICAgIGFwb2RWaWV3TW9kZWwuaW5pdERhdGFJdGVtcyhmb3JtYXR0ZXJzLmZvcm1hdERhdGUoY3VycmVudERhdGUpKS50aGVuKHJlcyA9PiB7XHJcbiAgICAgICAgaWYgKGFwcGxpY2F0aW9uLmFuZHJvaWQgJiYgKGFwb2RWaWV3TW9kZWwuZ2V0KFwiZGF0YUl0ZW1cIikubWVkaWFfdHlwZSA9PT0gXCJ2aWRlb1wiKSkge1xyXG4gICAgICAgICAgICBpbml0UGxheWVyKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcGxheWVyLnBhdXNlKCk7XHJcbiAgICAgICAgICAgIGFwb2RWaWV3TW9kZWwuc2V0KFwiaXNQbGF5ZXJWaXNpYmxlXCIsIGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG5leHREYXRlKCkge1xyXG4gICAgaWYgKGFwcGxpY2F0aW9uLmFuZHJvaWQpIHtcclxuICAgICAgICBzZXRCdXR0b25zT3BhY2l0eShzaGFyZUJ1dHRvbiwgc2F2ZUJ1dHRvbiwgZGVza3RvcEJ1dHRvbiwgMC4yKTtcclxuICAgICAgICBzZXRVc2VySW50ZXJhY3Rpb24oc2hhcmVCdXR0b24sIHNhdmVCdXR0b24sIGRlc2t0b3BCdXR0b24sIGZhbHNlKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY3VycmVudERhdGUgPSBhcG9kVmlld01vZGVsLmdldChcInNlbGVjdGVkRGF0ZVwiKTtcclxuICAgIGlmIChjdXJyZW50RGF0ZSA+PSBuZXcgRGF0ZSgpKSB7XHJcbiAgICAgICAgaWYgKGFwcGxpY2F0aW9uLmFuZHJvaWQpIHtcclxuICAgICAgICAgICAgdG9hc3QubWFrZVRleHQoXCJDYW4gbm90IGxvYWQgcGhvdG9zIGZyb20gdGhlIGZ1dHVyZSFcIikuc2hvdygpO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY3VycmVudERhdGUuc2V0RGF0ZShjdXJyZW50RGF0ZS5nZXREYXRlKCkgKyAxKTtcclxuICAgICAgICBhcG9kVmlld01vZGVsLnNldChcInNlbGVjdGVkRGF0ZVwiLCBjdXJyZW50RGF0ZSk7XHJcbiAgICAgICAgYXBvZFZpZXdNb2RlbC5pbml0RGF0YUl0ZW1zKGZvcm1hdHRlcnMuZm9ybWF0RGF0ZShjdXJyZW50RGF0ZSkpLnRoZW4ocmVzID0+IHtcclxuICAgICAgICAgICAgaWYgKGFwcGxpY2F0aW9uLmFuZHJvaWQgJiYgKGFwb2RWaWV3TW9kZWwuZ2V0KFwiZGF0YUl0ZW1cIikubWVkaWFfdHlwZSA9PT0gXCJ2aWRlb1wiKSkge1xyXG4gICAgICAgICAgICAgICAgaW5pdFBsYXllcigpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnBhdXNlKCk7XHJcbiAgICAgICAgICAgICAgICBhcG9kVmlld01vZGVsLnNldChcImlzUGxheWVyVmlzaWJsZVwiLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG9uRmluYWxJbWFnZVNldChhcmdzOiBGaW5hbEV2ZW50RGF0YSkge1xyXG4gICAgdmFyIGRyYXdlZSA9IGFyZ3Mub2JqZWN0IGFzIEZyZXNjb0RyYXdlZTtcclxuXHJcbiAgICBjdXJyZW50SW1hZ2UgPSBzZXRDdXJyZW50SW1hZ2UoZHJhd2VlLmltYWdlVXJpKTtcclxuXHJcbiAgICBzYXZlQnV0dG9uLmFuaW1hdGUoeyBvcGFjaXR5OiAwLjIsIHJvdGF0ZTogMzYwIH0pXHJcbiAgICAgICAgLnRoZW4oKCkgPT4geyByZXR1cm4gc2F2ZUJ1dHRvbi5hbmltYXRlKHsgb3BhY2l0eTogMC41LCByb3RhdGU6IDE4MCwgZHVyYXRpb246IDE1MCB9KTsgfSlcclxuICAgICAgICAudGhlbigoKSA9PiB7IHJldHVybiBzYXZlQnV0dG9uLmFuaW1hdGUoeyBvcGFjaXR5OiAxLjAsIHJvdGF0ZTogMCwgZHVyYXRpb246IDE1MCB9KTsgfSk7XHJcblxyXG4gICAgZGVza3RvcEJ1dHRvbi5hbmltYXRlKHsgb3BhY2l0eTogMC4yLCByb3RhdGU6IDM2MCB9KVxyXG4gICAgICAgIC50aGVuKCgpID0+IHsgcmV0dXJuIGRlc2t0b3BCdXR0b24uYW5pbWF0ZSh7IG9wYWNpdHk6IDAuNSwgcm90YXRlOiAxODAsIGR1cmF0aW9uOiAxNTAgfSk7IH0pXHJcbiAgICAgICAgLnRoZW4oKCkgPT4geyByZXR1cm4gZGVza3RvcEJ1dHRvbi5hbmltYXRlKHsgb3BhY2l0eTogMS4wLCByb3RhdGU6IDAsIGR1cmF0aW9uOiAxNTAgfSk7IH0pO1xyXG5cclxuICAgIHNoYXJlQnV0dG9uLmFuaW1hdGUoeyBvcGFjaXR5OiAwLjIsIHJvdGF0ZTogMzYwIH0pXHJcbiAgICAgICAgLnRoZW4oKCkgPT4geyByZXR1cm4gc2hhcmVCdXR0b24uYW5pbWF0ZSh7IG9wYWNpdHk6IDAuNSwgcm90YXRlOiAxODAsIGR1cmF0aW9uOiAxNTAgfSk7IH0pXHJcbiAgICAgICAgLnRoZW4oKCkgPT4geyByZXR1cm4gc2hhcmVCdXR0b24uYW5pbWF0ZSh7IG9wYWNpdHk6IDEuMCwgcm90YXRlOiAwLCBkdXJhdGlvbjogMTUwIH0pOyB9KVxyXG4gICAgICAgIC50aGVuKCgpID0+IHsgc2V0VXNlckludGVyYWN0aW9uKHNoYXJlQnV0dG9uLCBzYXZlQnV0dG9uLCBkZXNrdG9wQnV0dG9uLCB0cnVlKSB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG9uU2F2ZUltYWdlKGFyZ3M6IEV2ZW50RGF0YSkge1xyXG5cclxuICAgIGlmIChhcHBsaWNhdGlvbi5pb3MpIHtcclxuICAgICAgICBpbWFnZVNvdXJjZS5mcm9tVXJsKGlvc0ltYWdlLnNyYylcclxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcclxuICAgICAgICAgICAgICAgIHNhdmVGaWxlKHJlcywgYXBvZFZpZXdNb2RlbC5nZXQoXCJkYXRhSXRlbVwiKS51cmwsIGN1cnJlbnRTYXZlZFBhdGgpO1xyXG4gICAgICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKGFwcGxpY2F0aW9uLmFuZHJvaWQpIHtcclxuICAgICAgICBzYXZlRmlsZShjdXJyZW50SW1hZ2UsIGFwb2RWaWV3TW9kZWwuZ2V0KFwiZGF0YUl0ZW1cIikudXJsLCBjdXJyZW50U2F2ZWRQYXRoKTtcclxuICAgICAgICB0b2FzdC5tYWtlVGV4dChcIlBob3RvIHNhdmVkIGluIC9Eb3dubG9hZHMvQ29zbW9zRGF0YUJhbmsvXCIpLnNob3coKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG9uU2V0V2FsbHBhcGVyKGFyZ3M6IEV2ZW50RGF0YSkge1xyXG5cclxuICAgIGlmIChhcHBsaWNhdGlvbi5pb3MpIHtcclxuICAgICAgICBpbWFnZVNvdXJjZS5mcm9tVXJsKGlvc0ltYWdlLnNyYylcclxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRJbWFnZSA9IHJlczsgLy8gVE9ETyA6IHNldCB3YWxscGFwZXIgZm9yIGlPU1xyXG4gICAgICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgICAgICAgICAgfSk7O1xyXG4gICAgfSBlbHNlIGlmIChhcHBsaWNhdGlvbi5hbmRyb2lkKSB7XHJcbiAgICAgICAgc2F2ZUZpbGUoY3VycmVudEltYWdlLCBhcG9kVmlld01vZGVsLmdldChcImRhdGFJdGVtXCIpLnVybCwgY3VycmVudFNhdmVkUGF0aCk7XHJcblxyXG4gICAgICAgIHZhciB3YWxscGFwZXJNYW5hZ2VyID0gYW5kcm9pZC5hcHAuV2FsbHBhcGVyTWFuYWdlci5nZXRJbnN0YW5jZSh1dGlscy5hZC5nZXRBcHBsaWNhdGlvbkNvbnRleHQoKSk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIGltYWdlVG9TZXQgPSBpbWFnZVNvdXJjZS5mcm9tRmlsZShjdXJyZW50U2F2ZWRQYXRoKTtcclxuICAgICAgICAgICAgd2FsbHBhcGVyTWFuYWdlci5zZXRCaXRtYXAoaW1hZ2VUb1NldC5hbmRyb2lkKTtcclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0b2FzdC5tYWtlVGV4dChcIldhbGxwYXBlciBTZXQhXCIpLnNob3coKTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG9uU2hhcmUoYXJnczogRXZlbnREYXRhKSB7XHJcblxyXG4gICAgZmlyZWJhc2VQdXNoKGFwb2RWaWV3TW9kZWwuZ2V0KFwiZGF0YUl0ZW1cIikpO1xyXG5cclxuICAgIGlmIChhcHBsaWNhdGlvbi5hbmRyb2lkKSB7XHJcbiAgICAgICAgU29jaWFsU2hhcmUuc2hhcmVJbWFnZShjdXJyZW50SW1hZ2UsIFwiTkFTQSBBUE9EXCIpO1xyXG4gICAgfSBlbHNlIGlmIChhcHBsaWNhdGlvbi5pb3MpIHtcclxuICAgICAgICBpbWFnZVNvdXJjZS5mcm9tVXJsKGlvc0ltYWdlLnNyYylcclxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcclxuICAgICAgICAgICAgICAgIFNvY2lhbFNoYXJlLnNoYXJlSW1hZ2UocmVzKTtcclxuICAgICAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBpbml0UGxheWVyKCkge1xyXG4gICAgdmFyIG1lZGlhVXJsID0gYXBvZFZpZXdNb2RlbC5nZXQoXCJkYXRhSXRlbVwiKS51cmw7XHJcblxyXG4gICAgaWYgKG1lZGlhVXJsLmluZGV4T2YoXCJ5b3V0dWJlXCIpID49IDApIHtcclxuICAgICAgICBhcG9kVmlld01vZGVsLnNldChcImlzUGxheWVyVmlzaWJsZVwiLCB0cnVlKTtcclxuICAgICAgICB2YXIgeW91dHViZUlEID0geW91dHViZUhlbHBlcnMuZ2V0WW91VHViZUlEKG1lZGlhVXJsKTtcclxuICAgICAgICBwbGF5ZXIubG9hZFZpZGVvKHlvdXR1YmVJRCwgMTApOyAvLyBwYXNzIHRoZSBhY3R1YWwgdmlkZW8gaGVyZSBvciBsb2FkIHdlYi12aWV3XHJcbiAgICAgICAgcGxheWVyLnBsYXkoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcGxheWVyLnBhdXNlKCk7XHJcbiAgICAgICAgYXBvZFZpZXdNb2RlbC5zZXQoXCJpc1BsYXllclZpc2libGVcIiwgZmFsc2UpO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==