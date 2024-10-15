function chancecolor(value) {
    value = Math.max(0, Math.min(100, value));
  
    let red, green, blue;
  
    if (value <= 50) {
      red = Math.floor(255 * (1 - value / 50)); 
      green = 0;
      blue = 0;
    } else {
      red = 0;
      green = 0;
      blue = Math.floor(255 * ((value - 50) / 50)); 
    }
  
    const hex = (r, g, b) =>
      "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  
    return hex(red, green, blue);
}

const chanceLabels = {
    0: "Safe Republican",
    20: "Likely Republican",
    35: "Leaning Republican",
    45: "Toss Up",
    55: "Leaning Democrat",
    65: "Likely Democrat",
    80: "Safe Democrat"
}

function chancelabel(value) {
    if(value == 0)return "Safe Republican";
    let last = chanceLabels[0];
    for(let[chance, name] of Object.entries(chanceLabels)){
        if(parseInt(value) >= parseInt(chance)){
            last = name
        } else {
            return last
        }
    }
    return last
}

function arravg(numbers) {
    const sum = numbers.reduce((acc, curr) => {
        return acc + curr;
    }, 0);

    return sum / numbers.length;
}

class Prediction {
    static amount = 0
    static tableElement = document.getElementById("outcomes")
    static dems = [];
    static reps = [];
    static ties = [];

    static clear(){
        Array.from(document.getElementsByClassName("prediction")).forEach(el=>{
            el.remove()
        })
        Prediction.amount = 0
    }

    constructor(dem, rep, tie, isAvg=false){
        Prediction.amount = Prediction.amount + 1
        Prediction.dems.push(parseFloat(dem))
        Prediction.reps.push(parseFloat(rep))
        Prediction.ties.push(parseFloat(tie))

        this.dem = dem;
        this.rep = rep;
        this.tie = tie;

        this.tableRow = document.createElement("tr")
        this.tableRow.classList.add("prediction")

        this.numCell = document.createElement("td")
        this.numCell.innerHTML = isAvg ? "Avg" : Prediction.amount
        this.tableRow.appendChild(this.numCell)
        
        this.demCell = document.createElement("td")
        this.demCell.innerHTML = `${dem}%`
        this.tableRow.appendChild(this.demCell)

        this.repCell = document.createElement("td")
        this.repCell.innerHTML = `${rep}%`
        this.tableRow.appendChild(this.repCell)

        this.tieCell = document.createElement("td")
        this.tieCell.innerHTML = `${tie}%`
        this.tableRow.appendChild(this.tieCell)

        Prediction.tableElement.appendChild(this.tableRow)
    }
}

function chanceWithMoe(percentage, marginOfError) {
    const min = Math.max(0, percentage - marginOfError);  
    const max = Math.min(100, percentage + marginOfError);
    return Math.random() * (max - min) + min;
}

function run(){
    Prediction.clear()
    loading.style.display = "flex"
    setTimeout(()=>{
        for(let i = 0;i < predictions;i++){
            let demWins = 0;
            let repWins = 0;
            let ties = 0;
            
            for(let i = 0;i < runs;i++){
                let demVotes = 0;
                let repVotes = 0;
                for(let [stateName, state] of Object.entries(State.states)){
                    let chance = state.chance
                    if(moeMode == "universal"){
                        chance = chanceWithMoe(chance, parseInt(moeUniversalValue))
                    }
                    if(moeMode = "perstate" && state.moe > 0){
                        chance = chanceWithMoe(chance, parseInt(state.moe))
                    }
                    let rand = Math.random() * 100;
                    if(chance > rand){
                        demVotes = demVotes + state.votes;
                    } else {
                        repVotes = repVotes + state.votes;
                    }
                }
                if(demVotes < 270 && repVotes < 270){
                    ties = ties + 1
                } else {
                    if(repVotes > demVotes){
                        repWins = repWins + 1
                    } else {
                        demWins = demWins + 1
                    }
                }
            }

            new Prediction(((demWins / runs) * 100).toFixed(2), ((repWins / runs) * 100).toFixed(2), ((ties / runs) * 100).toFixed(2))
        }
        new Prediction(arravg(Prediction.dems).toFixed(2), arravg(Prediction.reps).toFixed(2), arravg(Prediction.ties).toFixed(2), true)
        loading.style.display = "none"
    }, 500)
}

class State {
    static states = {};

    constructor(name, votes, battleground, chance) {
        this.name = name;
        this.votes = votes;
        this.battleground = battleground;
        this.chance = chance;
        this.moe = 0;
        State.states[name] = this;

        this.masterElementName = battleground ? "battlegroundStates" : "otherStates"
        this.masterElement = document.getElementById(this.masterElementName)
        this.container = document.createElement("div")
        this.container.classList.add("state")
        this.nameElement = document.createElement("h4")
        this.nameElement.innerHTML = name
        this.chanceInputNameElement = document.createElement("label")
        this.chanceInputNameElement.innerHTML = "Chance of Victory"
        this.chanceInputElement = document.createElement("input")
        this.chanceInputElement.type = "range"
        this.chanceInputElement.min = 0
        this.chanceInputElement.max = 100
        this.chanceInputElement.value = chance
        this.chanceInputLabelElement = document.createElement("label")
        this.chanceInputLabelElement.innerHTML = `${chance}% ${chancelabel(this.chance)}`
        this.chanceInputLabelElement.style.color = chancecolor(this.chance)
        this.chanceInputElement.oninput = ()=>{
            this.chance = this.chanceInputElement.value
            this.chanceInputLabelElement.innerHTML = `${this.chance}% ${chancelabel(this.chance)}`
            this.chanceInputLabelElement.style.color = chancecolor(this.chance)
        }
        this.chanceInputElement.addEventListener("change", ()=>{
            if(autochange)run()
        })
        this.moeContainerElement = document.createElement("div")
        this.moeContainerElement.classList.add("moeContainer")
        this.moeNameElement = document.createElement("label")
        this.moeNameElement.innerHTML = "Margin of Error"
        this.moeInputElement = document.createElement("input")
        this.moeInputElement.type = "range"
        this.moeInputElement.min = 0
        this.moeInputElement.max = 100
        this.moeInputElement.value = 0
        this.moeInputLabelElement = document.createElement("label")
        this.moeInputLabelElement.innerHTML = "0%"
        this.moeInputElement.oninput = ()=>{
            this.moe = this.moeInputElement.value
            this.moeInputLabelElement.innerHTML = `${this.moe}%`
        }
        this.moeInputElement.addEventListener("change", ()=>{
            if(autochange)run()
        })
        this.moeContainerElement.appendChild(this.moeNameElement)
        this.moeContainerElement.appendChild(this.moeInputElement)
        this.moeContainerElement.appendChild(this.moeInputLabelElement)
        this.moeContainerElement.appendChild(document.createElement("br"))
        this.container.appendChild(this.nameElement)
        this.container.appendChild(this.chanceInputNameElement)
        this.container.appendChild(this.chanceInputElement)
        this.container.appendChild(this.chanceInputLabelElement)
        this.container.appendChild(document.createElement("br"))
        this.container.appendChild(this.moeContainerElement)
        this.masterElement.appendChild(this.container)
    }
}

new State("Alabama", 9, false, 0)
new State("Alaska", 3, false, 0)
new State("Arizona", 11, true, 50)
new State("Arkansas", 11, false, 0)
new State("California", 54, false, 100)
new State("Colorado", 10, false, 100)
new State("Connecticut", 7, false, 100)
new State("Delaware", 3, false, 100)
new State("District of Columbia", 3, false, 100)
new State("Florida", 30, true, 20)
new State("Georgia", 16, true, 40)
new State("Hawaii", 4, false, 100)
new State("Idaho", 4, false, 0)
new State("Illinois", 19, false, 100)
new State("Indiana", 11, false, 0)
new State("Iowa", 6, false, 0)
new State("Kansas", 8, false, 0)
new State("Louisiana", 8, false, 0)
new State("Maine", 4, false, 100)
new State("Maryland", 10, false, 100)
new State("Massachusetts", 11, false, 100)
new State("Michigan", 15, true, 50)
new State("Minnesota", 10, false, 100)
new State("Mississippi", 6, false, 0)
new State("Missouri", 10, false, 0)
new State("Montana", 4, false, 0)
new State("Nebraska", 5, false, 0)
new State("Nevada", 6, true, 50)
new State("New Hampshire", 4, false, 100)
new State("New Jersey", 14, false, 100)
new State("New Mexico", 5, false, 100)
new State("New York", 28, false, 100)
new State("North Carolina", 16, true, 40)
new State("North Dakota", 3, false, 0)
new State("Ohio", 17, false, 0)
new State("Oklahoma", 7, false, 0)
new State("Oregon", 8, false, 100)
new State("Pennsylvania", 19, true, 50)
new State("Rhode Island", 4, false, 100)
new State("South Carolina", 9, false, 0)
new State("South Dakota", 3, false, 0)
new State("Tennessee", 11, false, 0)
new State("Texas", 40, true, 20)
new State("Utah", 6, false, 0)
new State("Vermont", 3, false, 100)
new State("Virginia", 13, false, 100)
new State("Washington", 12, false, 100)
new State("West Virginia", 4, false, 0)
new State("Wisconsin", 10, true, 50)
new State("Wyoming", 3, false, 0)

class NavbarLink {
    static navbarElement = document.getElementById("navigator")

    constructor(name, icon, elementName) {
        this.name = name;
        this.icon = icon;
        this.elementName = elementName;

        this.navElement = document.createElement("img")
        this.navElement.src = icon;
        this.navElement.classList.add("nav")
        this.navElement.title = name;
        this.navElement.addEventListener("click", ()=>{
            let href = window.location.href;
            href = href.split("#")[0]
            window.location.href = `${href}#${elementName}`
        })
        NavbarLink.navbarElement.appendChild(this.navElement)
    }
}

new NavbarLink("Information", "./assets/icons/fill/info.png", "information")
new NavbarLink("Outcomes", "./assets/icons/fill/barchart.png", "outcomepredictions")
new NavbarLink("Settings", "./assets/icons/fill/settings.png", "settings")
new NavbarLink("States", "./assets/icons/fill/globe.png", "states")

const moeinputDisabled = document.getElementById("moeDisabled")
const moeinputUniversal = document.getElementById("moeUniversal")
const moeinputUniversalRange = document.getElementById("moeUniversalValue")
const moeinputUniversalRangeLabel = document.getElementById("moeUniversalValueLabel")
const moeinputPerstate = document.getElementById("moePerState")
let moeMode = "disabled"
let moeUniversalValue = 10

function togglemoe(enable=true){
    let style = enable ? "block" : "none";
    Array.from(document.getElementsByClassName("moeContainer")).forEach(el=>{
        el.style.display = style
    })
}

moeinputDisabled.oninput = ()=>{
    togglemoe(false)
    moeMode = "disabled"
    moeinputUniversalRange.disabled = true
    if(autochange)run()
}

moeinputUniversal.oninput = ()=>{
    togglemoe(false)
    moeMode = "universal"
    moeinputUniversalRange.disabled = false
    if(autochange)run()
}

moeinputPerstate.oninput = ()=>{
    togglemoe(true)
    moeMode = "perstate"
    moeinputUniversalRange.disabled = true
    if(autochange)run()
}

if(moeinputDisabled.checked){
    moeMode = "disabled"
}

if(moeinputUniversal.checked){
    moeMode = "universal"
}

if(moeinputPerstate.checked){
    moeMode = "perstate"
    togglemoe(true)
}

moeinputUniversalRange.oninput = ()=>{
    moeUniversalValue = moeinputUniversalRange.value
    moeinputUniversalRangeLabel.innerHTML = `${moeUniversalValue}%`
}

moeinputUniversalRange.addEventListener("change", ()=>{
    if(autochange)run()
})

let runsInput = document.getElementById("numsims")
let runs = runsInput.value

let runsInputLast;
runsInput.addEventListener("change", ()=>{
    runs = runsInput.value

    let now = Date.now()
    runsInputLast = now
    setTimeout(()=>{
        if(autochange && now == runsInputLast)run()
    }, 1000)
})

let autochangeInput = document.getElementById("autogen")
let autochange = autochangeInput.checked

autochangeInput.oninput = ()=>{
    autochange = autochangeInput.checked
}

let predictionsInput = document.getElementById("outcomeAmount")
let predictions = predictionsInput.value

let predictionsInputLast;
predictionsInput.addEventListener("change", ()=>{
    predictions = predictionsInput.value

    let now = Date.now()
    predictionsInputLast = now
    setTimeout(()=>{
        if(autochange && now == predictionsInputLast)run()
    }, 1000)
})

let runBtn = document.getElementById("run")
runBtn.addEventListener("click", run)

let loading = document.getElementById("loading")