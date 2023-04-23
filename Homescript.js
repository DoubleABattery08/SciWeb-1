// to push, type "git push origin main" into the shell

function init(){
  getLogin()
  
  
  
}
// UNCOMMENT TO RUN
init();

async function getLogin(){
const response = await fetch('https://sheetdb.io/api/v1/pb8spx7u5gewk?sort=limit=1', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});

if (response.ok) {
  const data = await response.json();
  const firstName = data[0].first_name;
  const lastName = data[0].last_name;
  setName(firstName+" "+lastName);
} else {
  alert('Failed to read data from SheetDB');
}

}
function setName(name){
  
  
  document.getElementById('Islink').textContent = name;
}

