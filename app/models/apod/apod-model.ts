import { Observable } from "data/observable";
import { ObservableArray } from "data/observable-array";
import http = require("http");

let API_URL = "https://api.nasa.gov/planetary/apod";
let API_KEY = "?api_key=jXRI5DynwdFVqt950uq6XMwZtlf6w8mSgpTJTcbX";
let HD_PIC = "&hd=true";
// Parameter	Type	    Default	    Description
// date	        YYYY-MM-DD	today	    The date of the APOD image to retrieve
// hd	        bool	    False	    Retrieve the URL for the high resolution image
// api_key	    string	    DEMO_KEY	api.nasa.gov key for expanded usage

export class ApodViewModel extends Observable {

    private _dataItem: ApodItem;
    private _urlApod: string;
    private _selectedDate: Date;

    constructor() {
        super();

        this._selectedDate = new Date();
    }    

    public get dataItem() {   
        return this._dataItem;
    }

    public set dataItem(value: ApodItem) {
        if (this._dataItem !== value) {
            this._dataItem = value;
            this.notifyPropertyChange("dataItem", value);
        }
    }

    public get selectedDate() {   
        return this._selectedDate;
    }

    public set selectedDate(value: Date) {
        if (this._selectedDate !== value) {
            this._selectedDate = value;
            this.notifyPropertyChange("selectedDate", value);
        }
    }

    public getUpdatedUrl() {
        return this._urlApod = API_URL + API_KEY + HD_PIC;
    }

    public initDataItems(date?: string) {
        if (date) {
            this.requestApod(this.dataItem, this.getUpdatedUrl(), date);           
        } else {
            this.requestApod(this.dataItem, this.getUpdatedUrl());
        }
    }
    
    public requestApod(apodDataItem: ApodItem, apiUrl: string, date?: string) {
        var that = this;

        if (date) {
            date = "&date=" + date;
            apiUrl = apiUrl + date;
        }

        http.request({ url: apiUrl, method: "GET" }).then(function (response) {
            // Argument (response) is HttpResponse!
            if (response.statusCode === 400) {
                console.log("NO Picture of the Dat - err 400");
                return;
            }

            var result = response.content.toJSON();

            apodDataItem = new ApodItem(result["copyright"], 
                                  result["date"], 
                                  result["explanation"], 
                                  result["hdurl"], 
                                  result["media_type"], 
                                  result["service_version"], 
                                  result["title"], 
                                  result["url"] );


        }, function (e) {
            // console.log(e.stack);
        }).then(function() {
            that.dataItem = apodDataItem;
        })
    }
}

export class ApodItem {

    public copyright: string;
    public date: string;
    public explanation: string;
    public hdurl: string;
    public media_type: string;
    public service_version: string;
    public title: string;
    public url: string;

    constructor(copyright: string, date: string, explanation: string, hdurl: string, media_type: string, service_version: string, title: string, url: string) {
        this.copyright = copyright;
        this.date = date;
        this.explanation = explanation;
        this.hdurl = hdurl;
        this.media_type = media_type;
        this.service_version = service_version;
        this.title = title;
        this.url = url;
    }
}