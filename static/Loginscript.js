//hide loading wheel
document.getElementById("loadingWheel").style.display = "none";
const form = document.getElementById('login-form');
console.log("loginscript ip:"+ip);
function demo(){
  document.getElementById("loadingWheel").style.display = "block";
  console.log(ip)
  post_login({
    "first_name": "Demo", 
    "last_name": "Account", 
    "osis": "3428756",
    "password": "password",
    "grade": "15",
    "IP": ip
  });
}
form.addEventListener('submit', function(event) {
  document.getElementById("loadingWheel").style.display = "block";
  // Prevent the form from submitting normally
  event.preventDefault();

  // Get the input values
  const fname = document.getElementById('fname').value;
  const lname = document.getElementById('lname').value;
  const password = document.getElementById('password').value;
  const grade = document.getElementById('grade').value;
  //generate random 7 digit osis
  const osis = Math.floor(Math.random() * 9000000)+1000000;
  document.getElementById("login-form").reset();
  
  post_login({
    "first_name": fname, 
    "last_name": lname, 
    "osis": osis, 
    "grade": grade,
    "password": password,
    "IP": ip
  });
  

  
  

});
// Using setTimeout



async function post_login(data){
  const result = await fetchRequest('/post-login', data);
  
  
    window.location.href = "/";


}

  

// to push, type "git push origin main" into the shell










