import { EventData, Observable } from "data/observable";
import { ObservableArray } from "data/observable-array";
import { Page } from "ui/page";
import { GridLayout } from "ui/layouts/grid-layout";
import * as frame from "ui/frame";

import { RoversViewModel, DataItem } from "../../models/rovers/rovers-view-model";
import { DrawerOverNavigationModel } from  "../../models/drawer-over-navigation-model";
import { pickersViewModel } from "./rovers-selection";

import http = require("http");
import * as RadListwModule from "nativescript-telerik-ui/listview";
import {FrescoDrawee, FinalEventData } from "nativescript-fresco";

let page;
let list;
let pageContainer;

var selectedRover;
var year;
var month;
var day;

let roversViewModel;

// Rovers: opportunity (2004- 2009), spirit (2004 - 2010), curiosity (2012 - present)
export function onPageLoaded(args: EventData) {
    page = <Page>args.object;
}

export function onPageNavigatedTo(args: EventData) {
    page = <Page>args.object;

    pageContainer = <GridLayout>page.getViewById("pageContainer");

    var navgationContext = page.navigationContext;

    if (!roversViewModel || !(selectedRover === navgationContext["rover"] 
                                && year === navgationContext["year"] 
                                && month === navgationContext["month"] 
                                && day === navgationContext["day"])) {

        selectedRover = navgationContext["rover"];
        year = navgationContext["year"];
        month = navgationContext["month"];
        day = navgationContext["day"];
        selectedRover = navgationContext["rover"];

        pickersViewModel.set("day", day);
        pickersViewModel.set("month", month);
        pickersViewModel.set("year", year);
        pickersViewModel.set("rover", selectedRover);

        switch (selectedRover) {
            case "curiosity":
                roversViewModel = new RoversViewModel(selectedRover, year, month, day);          
                break;
            case "opportunity":
                roversViewModel = new RoversViewModel(selectedRover, year, month, day);
                break;  
            case "spirit":
                roversViewModel = new RoversViewModel(selectedRover, year, month, day);
                break;            
            default:
                break;
        } 
        
        roversViewModel.initDataItems();
    }

    pageContainer.bindingContext = roversViewModel;
}

export function onListLoaded(args: RadListwModule.ListViewEventData) {
    list = <RadListwModule.RadListView>args.object;

    if (list.items) {
        list.scrollToIndex(roversViewModel.get("cachedIndex"));
    }
}

export function onItemTap(args:RadListwModule.ListViewEventData) {
    var tappedItemIndex = args.itemIndex;
    roversViewModel.set("cachedIndex", tappedItemIndex);

    var tappedItem = roversViewModel.get("dataItems").getItem(tappedItemIndex);

    frame.topmost().navigate({
        moduleName: "views/rovers/photo-details-page",
        context: {"tappedItem": tappedItem },
        animated: true
    });
}

export function onFinalImageSet(args: FinalEventData) {
    var drawee = args.object as FrescoDrawee;
}
