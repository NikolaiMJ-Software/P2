
document.addEventListener("DOMContentLoaded", async () => {
    //Page change buttons
    document.getElementById("user-button").addEventListener("click", () => {
        hidePages()
        document.getElementById("users").style = ""
        userTable()
    })
    document.getElementById("shop-button").addEventListener("click", () =>{
        hidePages()
        document.getElementById("shops").style = ""
        shopTable()
    })   
})

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
        let tableRow = document.createElement("tr")
        let userId = document.createElement("td")
        let username = document.createElement("td")
        let email = document.createElement("td")
        let shopId = document.createElement("td")
        let shopName = document.createElement("td")
        let shopSlct = document.createElement("select")
        let deleteTd = document.createElement("td")
        let deleteBtn = document.createElement("button")

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

    let updateBtn = document.getElementById("shopUpdate")
    updateBtn.onclick = () => {
        alert("Functionality not added yet")
    }
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
        let tableRow = document.createElement("tr")
        let shopId = document.createElement("td")
        let cityId = document.createElement("td")
        let shopName = document.createElement("td")
        let emailTd = document.createElement("td")
        let emailEdit = document.createElement("button")

        let revenue = document.createElement("td")

        let dashboard = document.createElement("td")
        let dashboardBtn = document.createElement("button")

        let deleteTd = document.createElement("td")
        let deleteBtn = document.createElement("button")

        //Delete shop functionality
        deleteBtn.textContent = "delete shop"
        deleteBtn.onclick = async () =>{
            if(confirm("Er du sikker på at du vil slette " + shop.shop_name + "?")){
                const id = shop.id
                const updateRes = await fetch("./delete_shop", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id })
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


        //Initialize table contents
        shopId.textContent = shop.id
        cityId.textContent = shop.city_id
        shopName.textContent = shop.shop_name
        emailTd.textContent = shop.email
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