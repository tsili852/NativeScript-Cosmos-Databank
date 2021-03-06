// tslint:disable:variable-name
import { Observable } from "data/observable";
import { ObservableArray } from "data/observable-array";
import * as http from "http";
import { NASA_API_KEY, YOUTUBE_API_KEY } from "../../files/credentials";

let API_URL = "https://api.nasa.gov/planetary/apod";
let API_KEY = "?" + NASA_API_KEY;

let HD_PIC = "&hd=true";
// Parameter	Type	    Default	    Description
// date	        YYYY-MM-DD	today	    The date of the APOD image to retrieve
// hd	        bool	    False	    Retrieve the URL for the high resolution image
// api_key	    string	    DEMO_KEY	api.nasa.gov key for expanded usage

export class ApodViewModel extends Observable {

    private _dataItem: ApodItem;
    private _urlApod: string;
    private _selectedDate: Date;
    private _isPlayerVisible: boolean = false;

    constructor() {
        super();
        this._selectedDate = new Date();
    }

    public get isPlayerVisible() {
        return this._isPlayerVisible;
    }

    public set isPlayerVisible(value: boolean) {
        if (this._isPlayerVisible !== value) {
            this._isPlayerVisible = value;
            this.notifyPropertyChange("isPlayerVisible", value);
        }
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

    public initDataItems(date?: string): Promise<ApodItem> {
        return new Promise<ApodItem>((resolve) => {
            this.requestApod(this.getUpdatedUrl(), date)
                .then(resultApodDataItem => {
                    this.dataItem = resultApodDataItem;
                    resolve(this.dataItem);
                });
        });

    }

    public requestApod(apiUrl: string, date?: string): Promise<ApodItem> {
        // default: no date === today
        if (date) {
            date = "&date=" + date;
            apiUrl = apiUrl + date;
        }

        return new Promise<ApodItem>((resolve, reject) => {

            http.request({ url: apiUrl, method: "GET" })
                .then(response => {
                    // Argument (response) is HttpResponse!
                    if (response.statusCode === 400) {
                        console.log("NO APOD for that date - err 400");
                        return;
                    }

                    var result = response.content.toJSON();
                    return new ApodItem(result["copyright"],
                        result["date"],
                        result["explanation"],
                        result["hdurl"],
                        result["media_type"],
                        result["service_version"],
                        result["title"],
                        result["url"]);

                }).then(resultApodDataItem => {
                    try {
                        resolve(resultApodDataItem);
                    } catch (e) {
                        reject(e);
                    }

                }).catch(err => {
                    console.log(err.stack);
                });

        });

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

    constructor(copyright: string,
        date: string,
        explanation: string,
        hdurl: string,
        mediaType: string,
        serviceVersion: string,
        title: string,
        url: string) {
        this.copyright = copyright;
        this.date = date;
        this.explanation = explanation;
        this.hdurl = hdurl;
        this.media_type = mediaType;
        this.service_version = serviceVersion;
        this.title = title;
        this.url = url;
    }
}
