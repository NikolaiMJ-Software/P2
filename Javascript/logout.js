async function check_login(){
    try{
        const response = await fetch('/user_logged_in');
        const data = await response.json();

        if(data.logged_in){
            document.getElementById('login').style.display = 'none';
            document.getElementById('signup').style.display = 'none';
            document.getElementById('logout').style.display = 'inline-block';
        }
    } catch (error){
        console.error("Filed check up:", error);
    }
}

document.addEventListener("DOMContentLoaded", ()=>{
    const logout = document.getElementById("logout");

    if(logout){
        logout.addEventListener("click", async ()=>{
            try{
                const response = await fetch('/logout');
                const message = await response.text();
                console.log("Du logger ud", message);
                window.location.reload();
            } catch (err){
                console.error("Kunne ikke logge ud:", err);
            }
        });
    }
});

check_login();