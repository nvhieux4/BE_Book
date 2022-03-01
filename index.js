const express = require("express");
const app = express();
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const paypal = require("paypal-rest-sdk");
const Orders = require("./model/Orders");

paypal.configure({
  mode: "sandbox",
  client_id:
    "Ab7593VRgUY6JIdZHTkMM7iDAbzR4tUX6HxtnUyiNbzqIkLDzeObGXxwDorCIRVJfYJd0dYFuuFvXH5M",
  client_secret:
    "ENiFumhDupVDCP7XTL8PJyFIANg_rXQcJFR73Jzi3b-xk1-4SnttCULkf9jbxccWsoYGPS6cavOvV8tg",
});
dotenv.config();
// import routes
const authRoute = require("./Routes/auth");
const category = require("./Routes/category");
const vip = require("./Routes/vip");
const book = require("./Routes/book");
const comment = require("./Routes/comment");
const rate = require("./Routes/rate");
const classCategory = require("./Routes/classCategory");
const download = require("./Routes/download");
app.use(cors());

// connect mongooseDB
mongoose.connect(
  process.env.DB_CONNECT_SOCIAL,
  { useNewUrlParser: true, useUnifiedTopology: true },
  () => console.log("connect to db")
);

//middleware
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
//Route middleware
app.use("/api/user", authRoute);
app.use("/api/category", category);
app.use("/api/vip", vip);
app.use("/api/book", book);
app.use("/api/comment", comment);
app.use("/api/rate", rate);
app.use("/api/classCategory", classCategory);
app.use("/api/download", download);

app.post("/pay", (req, res) => {
  console.log(req.body);
  let newData = [
    {
      item_list: {
        items: [
          {
            name: "vip 1",
            sku: "001",
            price: "1",
            currency: "USD",
            quantity: 1,
          },
        ],
      },
      amount: {
        currency: "USD",
        total: "1",
      },
      description: "vip 1",
    },
  ];
  if (req.body.data === 2) {
    newData = [
      {
        item_list: {
          items: [
            {
              name: "vip 2",
              sku: "001",
              price: "3",
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: "USD",
          total: "3",
        },
        description: "vip 2",
      },
    ];
  } else if (req.body.data === 3) {
    newData = [
      {
        item_list: {
          items: [
            {
              name: "vip 3",
              sku: "001",
              price: "7",
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: "USD",
          total: "7",
        },
        description: "vip 3",
      },
    ];
  }

  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "http://localhost:4200/success",
      cancel_url: "http://localhost:4200/cancel",
    },
    transactions: newData,
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      throw error;
    } else {
      res.send({ payment, data: req.body });
    }
  });
});
app.post("/success", (req, res) => {
  const payerId = req.body.PayerID;
  const paymentId = req.body.paymentId;
  const vip = req.body.vip;
  console.log(req.body);
  let data = [
    {
      amount: {
        currency: "USD",
        total: "1",
      },
    },
  ];

  if (vip === "2") {
    data = [
      {
        amount: {
          currency: "USD",
          total: "3",
        },
      },
    ];
  } else if (vip === "3") {
    data = [
      {
        amount: {
          currency: "USD",
          total: "7",
        },
      },
    ];
  }
  const execute_payment_json = {
    payer_id: payerId,
    transactions: data,
  };
  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        res.send(JSON.stringify(payment));
      }
    }
  );
});
app.post("/order", async (req, res) => {
  const newOrder = new Orders({
    date: req.body.date,
    description: req.body.description,
    idUser: req.body.idUser,
    nameVIP: req.body.nameVIP,
    paymentAccount: req.body.paymentAccount,
    price: req.body.price,
  });
  console.log(newOrder);
  const order = await newOrder.save();
  res.status(200).send({ message: "SUCCESS", result: order });
});

app.get("/cancel", (req, res) => res.send("Cancelled (Đơn hàng đã hủy)"));
// listen to server
app.listen(8080, () => console.log("server running"));
