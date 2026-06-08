// what are the data that we need to store
// username, password -> whenever the users signs in we will populate the users array
// organization -> users creates the organization it populates the organization array
// boards -> when user creates boards it is going to populate the boards array
// issues -> populates issues array

// users = [
//     {
//         id : 1,
//         username : "adnaan",
//         password : "123123"
//     }
// ]

// const organizations = [
//     {
//         id : 1,
//         title : "zomato",
//         description : "Food platform",
//         admin : 1,
//         members : []
//     }
// ];

// const boards = [
//     {id: 1,
//     title: "zomato website(frontend)",
//     organizations: 1,
//     }
// ];

// const issues = [
//     {
//         id: 1,
//         title: "Add dark mode",
//         boardId : 1,
//         state: "IN_PROGRESS" NEXT_UP | IN_PROGRESS | DONE | ARCHIVED
//     },
//     {
//         id: 2,
//         title: "fix random bug",
//         boardId : 1,
//         state: "IN_PROGRESS" NEXT_UP | IN_PROGRESS | DONE | ARCHIVEDJ
//     },

// ];

/*--------------------------------------------------------------*/

const express = require("express")
const jwt = require("jsonwebtoken")
const { authMiddleware } = require("./middleware");




const USERS = [];
const ORGANIZATIONS = [];
const BOARDS = [];
const ISSUES = [];

let USERS_ID = 1;
let ORGANIZATIONS_ID = 1;
let BOARD_ID = 1;
let ISSUES_ID = 1;

const app = express();
app.use(express.json())

/* __________________________ ROUTES _____________________________*/

// CREATE (POST)

app.post("/signup", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // check whether user already exists

    const userExists = USERS.find(user => user.username === username)

    if(userExists){
        res.status(403).json({
            message: "User with this username already exists"
        })
        return;
    }

    USERS.push({
        username: username,
        password: password,
        id: USERS_ID++
    })
    
    res.status(201).json({
        message: "You have signed up successfully"
    })

        //debug
    for(let i = 0; i < USERS.length; i++){
        console.log(USERS[i]);
  
    }
     console.log("_______________________________")

})

app.post("/signin", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const userExists = USERS.find(u => u.username === username && u.password === password)


    if(!userExists){
        res.status(403).json({
            message: "Incorrect Credentials"
        })
        return;
    }

   // create a jwt for the user if the credentials are valid

   const token = jwt.sign({
    userId: userExists.id
   }, "superSecretKey")

   res.json({
    token
   })

})


// AUTHENTICATED ROUTE - MIDDLEWARE

app.post("/organization", authMiddleware , (req, res) => {
    const userId = req.userId;
    ORGANIZATIONS.push({
        id: ORGANIZATIONS_ID++,
        title: req.body.title,
        description: req.body.description,
        admin: userId,
        members: []
    })
    
    res.json({
        message: "Org created Successfully",
        id: ORGANIZATIONS_ID - 1
    })

    //debug
    for(let i = 0; i < ORGANIZATIONS.length; i++){
        console.log(ORGANIZATIONS[i]);
    }
     console.log("_______________________________")

})

app.post("/add-member-to-organization", authMiddleware, (req, res) => {
    const userId = req.userId;
    const organizationId = parseInt(req.body.organizationId);
    const memberUsername = req.body.memberUsername;

    // first we will check wether the user that has sent request to add is the admin of 
    // the organization or not

    const organization = ORGANIZATIONS.find(org => org.id === organizationId);

    if(!organization || organization.admin !== userId){
        res.json({
            message: "Either this organizations does not exist or you are not an admin of this org"
        })
        return;
    }

    const memberUser = USERS.find(u => u.username === memberUsername);

    if(!memberUser){
        res.json({
            message: "No user with this username exists"
        })
        return;
    }

    const memberId = memberUser.id;

    if(organization.members.includes(memberId)){
        res.json({
            message: "The user you are trying to add is already a member"
        })
        return;
    }

    organization.members.push(memberId);

    res.json({
        message: "New member added!"
    })

      //debug
    console.log(organization)
        console.log(userId)
        console.log(organization.id)
     console.log("_______________________________")

})

app.post("/board", authMiddleware ,(req, res) => {
    const userId = req.userId;
    const title = req.body.title;
    const organizationId = parseInt(req.body.organizationId);

    const organization = ORGANIZATIONS.find(org => org.id === organizationId);

     if(!organization || organization.admin !== userId){
        res.json({
            message: "Either this organizations does not exist or you are not an admin of this org"
        })
        return;
    }

    BOARDS.push({
        id: BOARD_ID++,
        title,
        organizationId
    })

    res.json({
        message: "Board added succesfully",
        organization: organization.title
    })

})

app.post("/issue", authMiddleware,  (req, res) => {
    const userId = req.userId;
    const title = req.body.title
    const boardId = parseInt(req.body.boardId)
    const state = req.body.state

    const board = BOARDS.find(board => board.id === boardId)

    if(!board){
        res.json({
            message: "The board you are trying to add the issue does not exist"
        })
        return;
    }

    const organization = ORGANIZATIONS.find(org => org.id === board.organizationId)

    if(organization.admin !== userId){
        res.json({
            message: "You are not the admin of this board so you cannot "
        })
        return;
    }

    ISSUES.push({
        id: ISSUES_ID++,
        title,
        boardId,
        state
    })

    res.json({
        message: "Issue Created",
        title,
        boardName: board.title,
        organization: organization.title
    })
})

// READ (GET)

// backend.trello.com/boards?organizationId=1
// we will use query parameter

app.get("/organization", authMiddleware, (req, res) => {
    const userId = req.userId;
    const organizationId = parseInt(req.query.organizationId);

    const organization = ORGANIZATIONS.find(org => org.id === organizationId);


    if(!organization || organization.admin !== userId){
        res.json({
            message: "Either this organization does not exist or you are not an admin"
        })
        return;
    }

    res.json({
        organization : {
            ...organization,
            //we can build a lookup table (Map) from your USERS array for instant lookout while finding the user through userMap.get(1)
            //new Map([...])
            /*Map {
                     1 => { id: 1, username: "A" },
                     2 => { id: 2, username: "B" }
                }*/
            members: organization.members.map(memberId => {
                const user = USERS.find(user => user.id === memberId);
                // return {
                //     id: user.id,
                //     username: user.username
                // }
                //optimal
                return user 
                ? {id: user.id, username: user.username}
                : null;
            }).filter(Boolean)
        }
    })
})

//when asking for boards what should we ask
// through organization -> return all boards belong to that org , 
// through boardId -> return that specific board,
// through user id -- all boards that he has access ----> who will have access to the boards ? the admin of org and members of org

//get a specific board
app.get("/board", authMiddleware, (req, res) => {
    const userId = req.userId;
    const boardId = parseInt(req.query.boardId);

    const board = BOARDS.find(b => b.id === boardId);

    if(!board){
        res.json({
            message: "The board you are asking do not exist"
        })
        return;
    }
    
    const organization = ORGANIZATIONS.find(org => org.id === board.organizationId);

    const isAdmin = organization.admin === userId;
    
    const isMember = organization.members.includes(userId)

    if(!isAdmin && !isMember){
        res.json({
            message: "You are neither admin nor member so you cannot access this board"
        })
        return;
    }

    res.json({
        board
    })


})

//get all boards that belongs to an org
app.get("/boards", authMiddleware,  (req, res) => {
    const userId = req.userId;
    const organizationId = parseInt(req.query.organizationId);

    const organization = ORGANIZATIONS.find(o => o.id === organizationId);

    if(!organization){
        res.json({
            message: "The organization you are asking does not exist"
        })
        return;
    }
    
    const isAdmin = organization.admin === userId;
    
    const isMember = organization.members.includes(userId)

    if(!isAdmin && !isMember){
        res.json({
            message: "You are neither admin nor member so you cannot access the boards of this org"
        })
        return
    }

    const boards = BOARDS.filter(b => b.organizationId === organization.id)

    res.json({
        boards
    })


})


//testing -> not done
app.get("/issues",authMiddleware, (req, res) => {
    const userId = req.userId;
    const boardId = parseInt(req.query.boardId);

    // check if the board id is valid or not

    const board = BOARDS.find(b => b.id === boardId);

    if(!board){
        res.json({
            message: "The board you are asking do not exist"
        })
        return;
    }

    const organization = ORGANIZATIONS.find(org => org.id === board.organizationId);

    const isAdmin = organization.admin === userId;
    
    const isMember = organization.members.includes(userId)

    if(!isAdmin && !isMember){
        res.json({
            message: "You are neither admin nor member so you cannot access this board"
        })
        return;
    }

    const issues = ISSUES.filter(i => i.boardId === boardId)

    res.json({
        issues
    })

})

//testing -> not done
app.get("/members",authMiddleware, (req, res) => {
    const userId = req.userId;
    const organizationId = parseInt(req.query.organizationId);

    const organization = ORGANIZATIONS.find(o => o.id === organizationId);

    if(!organization){
        res.json({
            message: "The organization you are asking does not exist"
        })
        return;
    }
    
    const isAdmin = organization.admin === userId;
    
    const isMember = organization.members.includes(userId)

    if(!isAdmin && !isMember){
        res.json({
            message: "You are neither admin nor member so you cannot access the members"
        })
        return
    }

    const members = ORGANIZATIONS.members.map(memberId => {
        const user = USERS.find(u => u.id === memberId)
        return user?.username;
    })

    res.json({
        members
    })

})

// PUT (UPDATE)

//testing -> not done
app.put("/issues", authMiddleware ,(req, res) => {
    const userId = req.userId;
    const issueId = Number(req.body.issueId);
    const state = req.body.state;

    // {
//         id: 1,
//         title: "Add dark mode",
//         boardId : 1,
//         state: "IN_PROGRESS"->  NEXT_UP | IN_PROGRESS | DONE | ARCHIVED
//     }

    const validStates = [
        "NEXT_UP",
        "IN_PROGRESS",
        "DONE",
        "ARCHIVED"
    ];

   if(!validStates.includes(state)){
        res.json({
            message: "Invalid state"
        })
        return;
   }

    const issue = ISSUES.find(i => i.id === issueId);

       if(!issue){
        res.json({
            message: "The issue you are trying to modify does not exist"
        })
        return;
    }
    
    const board = BOARDS.find(b => b.id === issue.boardId);

    const organization = ORGANIZATIONS.find(org => org.id === board.organizationId);

    const isAdmin = organization.admin === userId;
    
    const isMember = organization.members.includes(userId)

    if(!isAdmin && !isMember){
        res.json({
            message: "You are neither admin nor member so you cannot access this board"
        })
        return;
    }

    // modify the issue state

    const prevState = issue.state;
    issue.state = state;

    res.json({
        message: "Issue state changed",
        prevState,
        currentState: state
    })

})

//


app.delete("/members", authMiddleware,  (req, res) => {

    const userId = req.userId;
    const organizationId = parseInt(req.body.organizationId);
    const memberUsername = req.body.memberUsername;

    // first we will check wether the user that has sent request to add is the admin of 
    // the organization or not
   
    const organization = ORGANIZATIONS.find(org => org.id === organizationId);

    if(!organization || organization.admin !== userId){
        res.json({
            message: "Either this organizations does not exist or you are not an admin of this org"
        })
        return;
    }

    const memberUser = USERS.find(u => u.username === memberUsername);

    if(!memberUser){
        res.json({
            message: "No user with this username exists"
        })
        return;
    }

    const memberId = memberUser.id;

    if(!organization.members.includes(memberId)){
        res.json({
            message: "The user you are trying to delete is not a member"
        })
        return;
    }

    organization.members = organization.members.filter(id => id !== memberId)


    res.json({
        message: "Member Deleted!"
    })



})



app.listen(3000);

