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
const { userModel, organizationModel, boardModel, issueModel} = require('./model')



// const USERS = [];
// const ORGANIZATIONS = [];
// const BOARDS = [];
// const ISSUES = [];

// let USERS_ID = 1;
// let ORGANIZATIONS_ID = 1;
// let BOARD_ID = 1;
// let ISSUES_ID = 1;

const app = express();
app.use(express.json())

/* __________________________ ROUTES _____________________________*/

// CREATE (POST)

app.post("/signup", async(req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // check whether user already exists

    // const userExists = USERS.find(user => user.username === username) 
    // migrating in memory to db
    const userExists =await userModel.findOne({
        username: username
    })

    if(userExists){
        res.status(403).json({
            message: "User with this username already exists"
        })
        return;
    }

    // USERS.push({
    //     username: username,
    //     password: password,
    //     id: USERS_ID++
    // })

    const newUser = await userModel.create({
        username: username,
        password: password
    })
    
    res.status(201).json({
        message: "You have signed up successfully",
        id: newUser._id
    })

})

app.post("/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // const userExists = USERS.find(u => u.username === username && u.password === password)
    const userExists = await userModel.findOne({
        username: username,
        password: password
    })


    if(!userExists){
        res.status(403).json({
            message: "Incorrect Credentials"
        })
        return;
    }

   // create a jwt for the user if the credentials are valid

   const token = jwt.sign({
    userId: userExists._id
   }, "superSecretKey")

   res.json({
    token,
    id: userExists._id
   })

})


// AUTHENTICATED ROUTE - MIDDLEWARE


app.post("/organization", authMiddleware , async(req, res) => {
    const userId = req.userId;
    const title = req.body.title;
    const description = req.body.description;

    // ORGANIZATIONS.push({
    //     id: ORGANIZATIONS_ID++,
    //     title: req.body.title,
    //     description: req.body.description,
    //     admin: userId,
    //     members: []
    // })

    const newOrg = await organizationModel.create({
        title,
        description,
        admin: userId,
        members:[]
    })
    
    res.json({
        message: "Org created Successfully",
        id: userId
    })
})

app.post("/add-member-to-organization", authMiddleware, async(req, res) => {
    const userId = req.userId;
    const organizationId = req.body.organizationId;
    const memberUsername = req.body.memberUsername;

    // first we will check wether the user that has sent request to add is the admin of 
    // the organization or not

    // const organization = ORGANIZATIONS.find(org => org.id === organizationId);
    const organization = await organizationModel.findOne({
        _id: organizationId
    })

    if(!organization || organization.admin.toString() !== userId){
        res.json({
            message: "Either this organizations does not exist or you are not an admin of this org"
        })
        return;
    }

    // const memberUser = USERS.find(u => u.username === memberUsername);
    const memberUser = await userModel.findOne({
        username: memberUsername
    })

    if(!memberUser){
        res.json({
            message: "No user with this username exists"
        })
        return;
    }

    const memberId = memberUser._id;

    // checks if user is already a member in org
    // if(organization.members.includes(memberId)){
    //     res.json({
    //         message: "The user you are trying to add is already a member"
    //     })
    //     return;
    // } not going to work because both memberId is objectId type

    const isAlreadyMember = organization.members.some(member => member.toString() === memberId.toString())
    if(isAlreadyMember){
        res.json({
            message: "The user you are trying to add is already a member"
        })
        return;
    }

    // organization.members.push(memberId);
   const updatedOrg =  await organizationModel.updateOne(
        {
        _id: organizationId
        },
        {
            $push:{
                members: memberId
            }
        }
    )

    res.json({
        message: "New member added!",
        id: memberId
    })

})

app.post("/board", authMiddleware ,async (req, res) => {
    const userId = req.userId;
    const title = req.body.title;
    const organizationId = req.body.organizationId;

    // const organization = ORGANIZATIONS.find(org => org.id === organizationId);
    const organization = await organizationModel.findOne({
        _id: organizationId
    })
    console.log(organization)
     if(!organization || organization.admin.toString() !== userId){
        res.json({
            message: "Either this organizations does not exist or you are not an admin of this org"
        })
        return;
    }

    // BOARDS.push({
    //     id: BOARD_ID++,
    //     title,
    //     organizationId
    // })
    const newBoard = boardModel.create({
        title,
        organizationId
    })

    res.json({
        message: "Board added succesfully",
        organization: organization.title
    })

})

app.post("/issue", authMiddleware,  async(req, res) => {
    const userId = req.userId;
    const title = req.body.title;
    const boardId = req.body.boardId;
    const state = req.body.state;

    // const board = BOARDS.find(board => board.id === boardId)
    const board = await boardModel.findOne({
        _id: boardId
    })

    if(!board){
        res.json({
            message: "The board you are trying to add the issue does not exist"
        })
        return;
    }

    // const organization = ORGANIZATIONS.find(org => org.id === board.organizationId)
    
    const organization = await organizationModel.findOne({
        _id: board.organizationId
    })

    console.log(organization)
    if(organization.admin.toString() !== userId){
        res.json({
            message: "You are not the admin of this board so you cannot "
        })
        return;
    }

    // ISSUES.push({
    //     id: ISSUES_ID++,
    //     title,
    //     boardId,
    //     state
    // })

    const issue = issueModel.create({
        title,
        boardId,
        state
    })

    res.json({
        id: issue._id,
        message: "Issue Created",
        title,
        boardName: board.title,
        organization: organization.title
    })
})

// READ (GET)

// backend.trello.com/boards?organizationId=1
// we will use query parameter

app.get("/organization", authMiddleware, async(req, res) => {
    const userId = req.userId;
    const organizationId = req.query.organizationId;

    // const organization = ORGANIZATIONS.find(org => org.id === organizationId);
    const organization = await organizationModel.findOne({
        _id: organizationId
    })

    if(!organization || organization.admin.toString() !== userId){
        res.json({
            message: "Either this organization does not exist or you are not an admin"
        })
        return;
    }

    const admin = await userModel.findOne({
        _id: organization.admin
    })

    const members = await userModel.find({
        _id: organization.members
    })


    res.json({
        organization: {
            title: organization.title,
            description: organization.description,
            admin: admin.username,
            members: members.map(m => ({
                username: m.username
            }))
        }


    //     organization : {
    //         ...organization,
    //         //we can build a lookup table (Map) from your USERS array for instant lookout while finding the user through userMap.get(1)
    //         //new Map([...])
    //         /*Map {
    //                  1 => { id: 1, username: "A" },
    //                  2 => { id: 2, username: "B" }
    //             }*/
    //         members: organization.members.map(memberId => {
    //             const user = USERS.find(user => user.id === memberId);
    //             // return {
    //             //     id: user.id,
    //             //     username: user.username
    //             // }
    //             //optimal
    //             return user 
    //             ? {id: user.id, username: user.username}
    //             : null;
    //         }).filter(Boolean)
    //     }
    })
})

//when asking for boards what should we ask
// through organization -> return all boards belong to that org , 
// through boardId -> return that specific board,
// through user id -- all boards that he has access ----> who will have access to the boards ? the admin of org and members of org

//get a specific board
app.get("/board", authMiddleware, async(req, res) => {
    const userId = req.userId;
    const boardId = req.query.boardId;

    // const board = BOARDS.find(b => b.id === boardId);
    const board = await boardModel.findOne({
        _id: boardId
    })

    if(!board){
        res.json({
            message: "The board you are asking do not exist"
        })
        return;
    }
    
    // const organization = ORGANIZATIONS.find(org => org.id === board.organizationId);
    const organization = await organizationModel.findOne({
        _id: board.organizationId
    })

    const isAdmin = organization.admin.toString() === userId;
    
    // const isMember = organization.members.includes(userId)
    const isMember = organization.members.some(member => member.toString() === userId)

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
app.get("/boards", authMiddleware,  async(req, res) => {
    const userId = req.userId;
    const organizationId = req.query.organizationId;

    // const organization = ORGANIZATIONS.find(o => o.id === organizationId);
    const organization = await organizationModel.findOne({
        _id: organizationId
    })

    if(!organization){
        res.json({
            message: "The organization you are asking does not exist"
        })
        return;
    }
    
    const isAdmin = organization.admin.toString() === userId;
    
    const isMember = organization.members.some(member => member.toString() === userId)
    console.log(isAdmin)
    console.log(isMember)
    if(!isAdmin && !isMember){
        res.json({
            message: "You are neither admin nor member so you cannot access the boards of this org"
        })
        return
    }
    // 
    // const boards = BOARDS.filter(b => b.organizationId === organization.id)
    const boards = await boardModel.find({
        organizationId: organizationId
    })
    res.json({
        boards : boards.map(b => title = b.title)
    })
})



app.get("/issues",authMiddleware, async(req, res) => {
    const userId = req.userId;
    const boardId = req.query.boardId;

    // check if the board id is valid or not

    // const board = BOARDS.find(b => b.id === boardId);
    const board = await boardModel.findOne({
        _id: boardId
    })

    if(!board){
        res.json({
            message: "The board you are asking do not exist"
        })
        return;
    }

    // const organization = ORGANIZATIONS.find(org => org.id === board.organizationId);
    const organization = await organizationModel.findOne({
        _id: board.organizationId
    })

    const isAdmin = organization.admin.toString() === userId;
    
    const isMember = organization.members.some(member => member.toString() === userId)

    if(!isAdmin && !isMember){
        res.json({
            message: "You are neither admin nor member so you cannot access this board"
        })
        return;
    }

    // const issues = ISSUES.filter(i => i.boardId === boardId)
    const issues = await issueModel.find({
        boardId: boardId
    })

    res.json({
        issues: issues.map(i => ({
            title: i.title,
            state: i.state
        }))
    })



})

app.get("/members",authMiddleware, async(req, res) => {
    const userId = req.userId;
    const organizationId = req.query.organizationId;

    // const organization = ORGANIZATIONS.find(o => o.id === organizationId);
    const organization = await organizationModel.findOne({
        _id: organizationId
    })

    if(!organization){
        res.json({
            message: "The organization you are asking does not exist"
        })
        return;
    }
    
    const isAdmin = organization.admin.toString() === userId;
    
    const isMember = organization.members.some(member => member.toString() === userId)

    if(!isAdmin && !isMember){
        res.json({
            message: "You are neither admin nor member so you cannot access the members"
        })
        return
    }

    // const members = await ORGANIZATIONS.members.map(memberId => {
    //     const user = USERS.find(u => u.id === memberId)
    //     return user?.username;
    // })// what we are doing here is we are extracting the members which belongs to the organization members and then extracting all the info of users then returning only the username of members


    const membersIds = organization.members;

    const members = await userModel.find({
        _id: membersIds
    })
    res.json({
        members: members.map(m => username = m.username )
    })
    })

// PUT (UPDATE)


app.put("/issues", authMiddleware ,async(req, res) => {
    const userId = req.userId;
    const issueId = req.body.issueId;
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

    // const issue = ISSUES.find(i => i.id === issueId);
    const issue = await issueModel.findOne({
        _id: issueId
    })

       if(!issue){
        res.json({
            message: "The issue you are trying to modify does not exist"
        })
        return;
    }
    
    // const board = BOARDS.find(b => b.id === issue.boardId);
    const board = await boardModel.findOne({
        _id: issue.boardId
    })

    // const organization = ORGANIZATIONS.find(org => org.id === board.organizationId);
    const organization = await organizationModel.findOne({
        _id: board.organizationId
    })

    const isAdmin = organization.admin.toString() === userId;
    
    const isMember = organization.members.some(member => member.toString() === userId)

    if(!isAdmin && !isMember){
        res.json({
            message: "You are neither admin nor member so you cannot access this board"
        })
        return;
    }

    // modify the issue state

    const prevState = issue.state;
    // issue.state = state;
    await issueModel.updateOne({
        _id: issueId
    },{
        $set:{state: state}
    })

    res.json({
        message: "Issue state changed",
        prevState,
        currentState: state
    })

})

//


app.delete("/members", authMiddleware,  async(req, res) => {

    const userId = req.userId;
    const organizationId = req.body.organizationId;
    const memberUsername = req.body.memberUsername;

    // first we will check wether the user that has sent request to add is the admin of 
    // the organization or not
   
    // const organization = ORGANIZATIONS.find(org => org.id === organizationId);
    const organization = await organizationModel.findOne({
        _id: organizationId
    })

    if(!organization || organization.admin.toString() !== userId){
        res.json({
            message: "Either this organizations does not exist or you are not an admin of this org"
        })
        return;
    }

    // const memberUser = USERS.find(u => u.username === memberUsername);
    const memberUser = await userModel.findOne({
        username: memberUsername
    })

    if(!memberUser){
        res.json({
            message: "No user with this username exists"
        })
        return;
    }

    const memberId = memberUser._id;

    const isMemberOfOrg = organization.members.some(member => member.toString() === memberId.toString())

    if(!isMemberOfOrg){
        res.json({
            message: "The user you are trying to delete is not a member"
        })
        return;
    }

    // organization.members = organization.members.filter(id => id !== memberId)

    const response = await organizationModel.updateOne({
        _id: organizationId // here i was stuck because i was giving memberId and searching for organization
    },{
        $pull:{
            members : memberId
        }
    })

    console.log(response)



    res.json({
        message: "Member Deleted!"
    })



})



app.listen(3000);

