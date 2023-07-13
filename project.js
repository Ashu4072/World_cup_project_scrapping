// run = node project.js --source="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results" --excel=worldcup.xls --datafolder=data

let minimit = require("minimist");
let fs = require("fs");
let axios = require("axios");
let jsdom = require("jsdom");
let excel = require("excel4node");
let pdf = require("pdf-lib");
let args = minimit(process.argv);
console.log(args.source);

// download using axios 
let responsekapromise = axios.get(args.source);
responsekapromise.then(function(response){
    let html = response.data;
    
    // use jsdo for read the important things about html ex- tittle etc

    let dom = new jsdom.JSDOM(html);  //html mla
    let document = dom.window.document; //html window me mila

    let matches = []; // matches naam ka ek array banaya jisme sare naam or score print karenge 
    let matchScoreDivs = document.querySelectorAll("div.match-score-block"); //ek div select ki match score block nam ki
    for(let i = 0;i<matchScoreDivs.length;i++){ // fir us div me loop lagaya
        let match = {  // fir ek string create kiya jisme naam score sb likh ke matches array me daal denge
        }; // matches ek array hai or match object hai 

        //          yaha naam nikalenge
        let namePara = matchScoreDivs[i].querySelectorAll("p.name"); // ek para hai usme class hai name ki 
        // to jo pehle aaayya wo t1 ka naam baad wala t2 ka to esehi nikal liya 
        match.t1 =namePara[0].textContent; //team 1 ka naam  
        match.t2 = namePara[1].textContent; // team 2 ka naam 

        // yaha se score 
        let scoreSpan  = matchScoreDivs[i].querySelectorAll("div.score-detail > span.score");
        

        if (scoreSpan.length==2){  // agr dono ki batting aay thi 

            match.t1s = scoreSpan[0].textContent;  
            match.t2s = scoreSpan[1].textContent;

        } else if (scoreSpan.length ==1){  // ek ki batting aayi 2nd inning me barish aa gai

            match.t1s = scoreSpan[0].textContent;  
            match.t2s = "";

        } else {
            match.t1s = "";  
            match.t2s = "";
        }

        // yaha se result 
        let resultDiv = matchScoreDivs[i].querySelector("div.status-text > span"); //to ek span hai jiska 
        // paerent status text hai to perent likhte hai ">" ese to wo span milege jiska perent div.status-text hoga 
        match.result = resultDiv.textContent; // result

        matches.push(match); // or yaha push kr diya string ko array me
    }

    // console.log(matches);   // isse sare match with result milenge

    let teams = [];
    for(let i = 0;i<matches.length;i++){
        putTeamInTeamsArrayIfMissing(teams , matches[i]);
    }   // ki pehle loop lagaya fir dekha ki kya ek match ki t1 and t2  team present hai teams array me aur nahi 
    // hai to daal do with help of putTeamInTeamsArrayIfMissing funtion ki help se

    
    for(let i = 0;i<matches.length;i++){
        putMatchInAppropriateTeams(teams , matches[i]);
    } 

    // let teamsJSON = JSON.stringify(teams);
    // fs.writeFileSync("teams.JSON",teamsJSON,"utf-8")    // isse 10 teams ke naam print honge

    createExcelFile(teams);

});

function putTeamInTeamsArrayIfMissing( teams , match){
    let t1idx = -1;
    for(let i = 0;i<teams.length;i++){  // loop lagaya or team khoja  
        if(teams[i].name == match.t1){ // ki kya kisi team ka naam match.t1 hai 
            t1idx = i;  // agr hai to wo naam teams array me daal kr break kr gye
            break;
        }
    }
    if(t1idx == -1){   // or agr nahi hai
        teams.push({  // nahi mili to push kr diya manually
            name: match.t1,  // kya to match ka t1 
            matches :[],     // or yaha t1 ke hi sare match aayenge
        });
    }

    let t2idx = -1;
    for(let i = 0;i<teams.length;i++){
        if(teams[i].name == match.t2){
            t2idx = i;
            break;
        }
    }
    if(t2idx == -1){
        teams.push({
            name: match.t2,
            matches :[],
        });
    }
}

function putMatchInAppropriateTeams (teams,match){
    let t1idx = -1;
    for(let i = 0;i<teams.length;i++){  // loop lagaya or team khoja   
        if(teams[i].name == match.t1){ // yaha match ho gai 
            t1idx = i;  // to wo naam daal kr break kr gye
            break;
        }
    }

    let team1 = teams[t1idx];   // ab team 1 banaya or usme puch kr diya vs self score opponent score and result
    team1.matches.push({
        vs : match.t2,
        selfScore : match.t1s,
        oppScore : match.t2s,
        result : match.result,
    });

    let t2idx = -1;
    for(let i = 0;i<teams.length;i++){  // loop lagaya or team khoja mil gai to well and good 
        if(teams[i].name == match.t2){ // yaha match ho gai 
            t2idx = i;  // to wo naam daal kr break kr gye
            break;
        }
    }

    let team2 = teams[t2idx];
    team2.matches.push({
        vs : match.t1,
        selfScore : match.t2s,
        oppScore : match.t1s,
        result : match.result,
    });


}

function createExcelFile(teams){

    let wb=new excel.Workbook();  // nayi workbook add ho gai

    for(let i =0;i<teams.length;i++){       
    let sheet = wb.addWorksheet(teams[i].name);

    sheet.cell(1,1).string("vs");  // isse 1st row ke 1st column me vs dal jayega
    sheet.cell(1,2).string("Self Score");
    sheet.cell(1,3).string("Opponent Score");
    sheet.cell(1,4).string("Result");
    

    for(let j =0;j<teams[i].matches.length;j++){    //ye utni baar chalega jitne match hai

        sheet.cell(2+j,1).string(teams[i].matches[j].vs);
        sheet.cell(2+j,2).string(teams[i].matches[j].selfScore);
        sheet.cell(2+j,3).string(teams[i].matches[j].oppScore);
        sheet.cell(2+j,4).string(teams[i].matches[j].result);

    }
}  // jitni teams hai utni sheet bn gai
wb.write(args.excel); // yaha wo sheet write ho gai
}