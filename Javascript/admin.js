
document.addEventListener("DOMContentLoaded", async () => {
    //Page change buttons
    document.getElementById("user-button").onclick = () => {
        hidePages() //hide all pages
        let users = document.getElementById("users")
        users.style = `` //show this page

        //Add search bar to page
        let userSearch = document.getElementById("userSearch");
        userSearch.innerHTML = ``
        userSearch.appendChild (createSearch())
        
        //load user data
        userTable()
    }

    document.getElementById("shop-button").onclick = () =>{
        hidePages() //hide all pages
        let shops = document.getElementById("shops")
        shops.style = "" //show this page

        //Add search bar to page
        let shopSearch = document.getElementById("shopSearch");
        shopSearch.innerHTML = ``
        shopSearch.appendChild(createSearch())

        //load shop data
        shopTable()
    }

    //close button
    document.getElementById("stop-button").onclick = () =>{
        if(confirm("Vil du gerne stoppe serveren?")){
            if(confirm("Er du helt sikker på du vil stoppe serveren?")){
                if(confirm("Er du 100% sikker?")){
                    alert("Server will close in 10 seconds")
                    setTimeout(stopServer, 12000) //stop server in 12 seconds
                    countdown(10); //start countdown for 10 seconds
                }
            }
        }
    }
})

//Create a countdown for an amount of seconds (used for stop button)
function countdown(seconds){
    let x = setInterval(() => {
        document.getElementById("timer").textContent = seconds;
        seconds--;

        if(seconds < 0){
            clearInterval(x);
        }
    }, 1000);
}

//Stop the server
async function stopServer(){
    alert("Server will now stop")
    await fetch("./stop_server")     
}

//Function to create the search bar and functionality
function createSearch(){
    //Initialize search field
    let searchField = document.createElement("input")
        searchField.type = "search"
        searchField.placeholder = "Søg efter email..."

    //Search field functionality
    searchField.addEventListener('input', () => {
        const searchValue = searchField.value.toLowerCase();
        console.log(searchValue);

        //find email values 
        let emails;
        if (searchField.parentElement.id === "userSearch"){
            emails = document.querySelectorAll(".userEmail")
        } else if (searchField.parentElement.id === "shopSearch"){
            emails = document.querySelectorAll(".shopEmail")
        }

        //Hide data not matching the search
        emails.forEach(email => {
            if (email.textContent.includes(searchValue)) {
                email.parentElement.classList.remove('hidden')// Show matching users
            } else {
                email.parentElement.classList.add('hidden') // Hide non-matching users
            }
        });
    });
        
    return searchField;
}

//Hides the tables
function hidePages() {
    const managementArea = document.getElementById("management-area")
    let temp = managementArea.firstElementChild
        while (temp != null){
            temp.style = "display: none;"
            temp = temp.nextElementSibling
        }
}

//Fetch User data
const userResponse = await fetch("./get_users")
const users = await userResponse.json()

function userTable(){
    //Table of Users
    const userTable = document.getElementById("user-table-body")

    //Reset the table to originial status
    userTable.innerHTML = `<tr>
    <th>ID</th>
    <th>Username</th>
    <th>Email</th>
    <th>Shop ID</th>
    <th><button id="shopUpdate">Update shops</button></th>
    <th>Delete</th>
    </tr>`

    //Insert all users into table
    users.forEach(user => {
        //initialize elements
        let tableRow = document.createElement("tr"),
            userId = document.createElement("td"),
            username = document.createElement("td"),
            email = document.createElement("td"),
            shopId = document.createElement("td"),
            shopName = document.createElement("td"),
            shopSlct = document.createElement("select"),
            deleteTd = document.createElement("td"),
            deleteBtn = document.createElement("button");

        //Delete user functionality
        deleteBtn.textContent = "delete user"
        deleteBtn.onclick = async () =>{
            if(confirm("Er du sikker på at du vil slette " + user.name + "?")){
                const id = user.id
                const updateRes = await fetch("./delete_user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id })
                });
                if (updateRes.ok) {
                    alert("Bruger er blevet fjernet.");
                    location.reload();
                } else {
                    alert("Kunne ikke opdatere lagerbeholdning.");
                }
            }
        }

        //Alter shop status
        shopSlct.name = "stores"
        shopSlct.className = "userStore"

        let nullShop = document.createElement("option")
        nullShop.value = null
        nullShop.textContent = null
        shopSlct.appendChild(nullShop)

        shops.forEach(shop => {
            let shopChoice = document.createElement("option")
            shopChoice.value = shop.id
            if(shopChoice.value == user.shop_id) shopChoice.selected="selected"
            shopChoice.textContent = shop.id + " " + shop.shop_name
            shopSlct.appendChild(shopChoice)
        })

        //Initialize table contents
        userId.textContent = user.id
        username.textContent = user.name
        email.textContent = user.email
        email.className = "userEmail"
        shopId.textContent = user.shop_id

        //initialize table
        tableRow.appendChild(userId)
        tableRow.appendChild(username)
        tableRow.appendChild(email)
        tableRow.appendChild(shopId)
        tableRow.appendChild(shopName)
        shopName.appendChild(shopSlct)
        tableRow.appendChild(deleteTd)
        deleteTd.appendChild(deleteBtn)
        userTable.appendChild(tableRow)
    });

    //Update user shop functionality
    let updateBtn = document.getElementById("shopUpdate")
    updateBtn.addEventListener('click', () => {
        const userShopIds = document.querySelectorAll(".userStore")
        if (confirm("Er du sikker på du vil opdatere shop id'er?")) {
            userShopIds.forEach(async userShop => {
            let userId = userShop.parentElement.parentElement.firstChild.textContent;
            let shopId = userShop.value
            console.log(`changed user ${userId} shop to shop ${shopId}`)
            fetch(`./update_userStores`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, shopId })
            });
        });}
        window.location.reload();
    })
}

//Fetch shop data
const shopsResponse = await fetch("./shop")
const shops = await shopsResponse.json()

function shopTable(){
    //Table of shops
    const shopTable = document.getElementById("shop-table-body")

    //Reset the table to originial status
    shopTable.innerHTML = `<tr>
    <th>ID</th>
    <th>City ID</th>
    <th>Shop name</th>
    <th>Email</th>
    <th>Revenue</th>
    <th>Shop Dashboard</th>
    <th>Delete</th>
    </tr>`

    //Insert all shops into table
    shops.forEach(shop => {
        //initialize elements for the table
        let tableRow = document.createElement("tr"),
            shopId = document.createElement("td"),
            cityId = document.createElement("td"),
            shopName = document.createElement("td"),
            emailTd = document.createElement("td"),
            emailEdit = document.createElement("button"),
            revenue = document.createElement("td"),
            dashboard = document.createElement("td"),
            dashboardBtn = document.createElement("button"),
            deleteTd = document.createElement("td"),
            deleteBtn = document.createElement("button");

        //Delete shop functionality
        deleteBtn.textContent = "delete shop"
        deleteBtn.onclick = async () =>{
            if(confirm("Er du sikker på at du vil slette " + shop.shop_name + "?")){
                const id = shop.id;
                const name = shop.shop_name;
                const cityid = shop.city_id;
                const updateRes = await fetch("./delete_shop", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, name, cityid })
                });
                if (updateRes.ok) {
                    alert("Shop er blevet fjernet.");
                    location.reload();
                } else {
                    alert("Kunne ikke opdatere lagerbeholdning.");
                }
            }
        }

        //Edit email functionality
        emailEdit.textContent = "edit"
        emailEdit.id="editBtn"
        emailEdit.onclick = async () =>{
            let id = shop.id
            let email = prompt("Indtast ny email")
            if (email){
                const updateRes = await fetch("./edit_email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, email })
                });
                if (updateRes.ok) {
                    alert("Email er blevet ændret.");
                    location.reload();
                } else {
                    alert("Kunne ikke opdatere lagerbeholdning.");
                }
            }
        }

        //Go to dashboard functionality
        dashboardBtn.textContent = "dashboard"
        dashboardBtn.onclick = () => {
            window.location.href=`./shop_dashboard?shop=${shop.id}`
        }


        //Initialize table contents
        shopId.textContent = shop.id
        cityId.textContent = shop.city_id
        shopName.textContent = shop.shop_name
        emailTd.textContent = shop.email
        emailTd.className = "shopEmail"
        revenue.textContent = shop.revenue
        
        //Initialize table
        tableRow.appendChild(shopId)
        tableRow.appendChild(cityId)
        tableRow.appendChild(shopName)
        tableRow.appendChild(emailTd)
        emailTd.appendChild(emailEdit)
        tableRow.appendChild(revenue)
        tableRow.appendChild(dashboard)
        dashboard.appendChild(dashboardBtn)
        tableRow.appendChild(deleteTd)
        deleteTd.appendChild(deleteBtn)
        shopTable.appendChild(tableRow)
    });
}

document.getElementById("ban-button").addEventListener("click", () => {
    const email = document.getElementById("ban-email").value.trim();

    //variable which checks if mails are valid
    const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    //test mail, if not valid sent error
    if (!email_regex.test(email)) {
        alert("Ugyldig email.");
        return;
    }

    // Example: Send ban request to server (you need backend handling for this)
    fetch(`./ban-user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    })
    .then(res => {
        if (res.ok) {
            alert(`User with email ${email} has been banned.`);
            document.getElementById("ban-email").value = '';
        } else {
            alert("Failed to ban user.");
        }
    })
    .catch(err => {
        console.error(err);
        alert("An error occurred while banning the user.");
    });
});
