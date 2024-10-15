const softwareContainer = document.getElementById("software");

class Software {
    static softwares = {}

    constructor(name, url){
        this.name = name;
        this.url = url;

        Software.softwares[name] = this;
        this.listElement = document.createElement("li");
        this.linkElement = document.createElement("a");
        this.linkElement.href = url;
        this.linkElement.innerHTML = name;
        this.listElement.appendChild(this.linkElement)
        softwareContainer.appendChild(this.listElement)
    }
};

new Software("Outage Recorder", "https://github.com/josephky/outagerecorder")
new Software("2024 Election Prediction Utility", "./election2024.html")

