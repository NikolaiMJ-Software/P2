//function to check if user is logged in
async function check_login(){
    try{
        //calls the server to check if there is a session logged in user
        const response = await fetch('./user_logged_in');
        const data = await response.json();
        //if anyone is logged in, it will hide the login and signup button and show the logout button
        if(data.logged_in){
            document.getElementById('login').style.display = 'none';
            document.getElementById('signup').style.display = 'none';
            document.getElementById('logout').style.display = 'inline-block';
            //if use is a shop owner, show the shop owner button
            if(data.shop_id){
                const dashboard = document.getElementById('shop');
                dashboard.style.display = 'inline-block';

                dashboard.addEventListener('click', ()=>{
                    window.location.href = './shop_dashboard';
                });
            }
            console.log(data.admin_user)
            //if use is an admin, show the admin button
            if(data.admin_user){
                const admin = document.getElementById("admin");
                admin.style.display = 'inline-block';

                admin.addEventListener('click', ()=>{
                    window.location.href = `./admin`;
                })
            }
        }

    } catch (error){
        //if any error, catch it here
        console.error("Filed check up:", error);
    }
}
//event listener to when page is loaded
document.addEventListener("DOMContentLoaded", ()=>{
    //gets element with the id logout from the html
    const logout = document.getElementById("logout");

    //if logout is true, and the logout button is clicked, the function is progressed
    if(logout){
        logout.addEventListener("click", async ()=>{
            try{
                //calls server using the logout route (found in routes_user.js)
                const response = await fetch('./logout');
                const message = await response.text();
                //if everything works, user is logged out, and page is refreshed
                console.log("Du logger ud", message);
                window.location.href = "./";
            } catch (err){
                //if user cannot log out, an error happens and user is told its not possible to log out
                console.error("Kunne ikke logge ud:", err);
            }
        });
    }
});

//calls the check_login function when code is run
check_login();