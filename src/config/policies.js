export const CONTACT = {
  email: "mtaimoorjamali82@gmail.com",
  phone: "+903101979989",
};

export const POLICIES = [
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    intro: "What this site keeps in your browser and what happens when you contact us.",
    sections: [
      {
        title: "Cart and theme preferences",
        text: "Aural Forge uses localStorage to remember your theme and the product families, finishes, and quantities in your cart. These values stay in your browser across visits until you remove them or clear the site's data. The app reads current prices from the catalog when it restores the cart.",
      },
      {
        title: "Checkout and saved orders",
        text: "Checkout checks the contact and shipping fields in your browser. The site does not submit those details to a server or save them in the order record. It saves the order number, selected items, quantities, and prices in localStorage in this browser. Clearing site data removes the saved confirmation.",
      },
      {
        title: "Newsletter preview",
        text: "Submitting the newsletter preview displays a message on the page. The form does not send or save the email address you enter.",
      },
      {
        title: "Contacting us",
        text: "The email and phone links open your email or calling app. If you choose to send a message or call, we may receive the information you share so we can respond.",
      },
    ],
  },
  {
    slug: "shipping-policy",
    title: "Shipping Policy",
    intro: "Checkout is a portfolio preview. No physical orders are fulfilled.",
    sections: [
      {
        title: "Availability",
        text: "Adding an item to your cart or completing checkout does not reserve inventory or arrange delivery. An order confirmation records your selection in the browser.",
      },
      {
        title: "Delivery details",
        text: "The shipping form lets you try the checkout steps. The site neither sends those details nor creates a shipment. It does not provide shipping charges, delivery dates, or tracking.",
      },
    ],
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    intro: "Checkout does not collect payment or create a financial purchase.",
    sections: [
      {
        title: "Prices and totals",
        text: "Product prices and the subtotal show the value of your selection. Completing checkout saves a local order record. It does not charge you, so there is no payment to refund.",
      },
      {
        title: "Removing a selection",
        text: "You can change a quantity or remove an item in the cart. These actions update the items stored in your browser.",
      },
    ],
  },
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    intro: "Aural Forge is a portfolio project for exploring product design, finishes, and interactive 3D presentation.",
    sections: [
      {
        title: "Viewing the collection",
        text: "The product stories and images present design concepts. The site lets you compare finishes and preview how a cart works.",
      },
      {
        title: "Shopping features",
        text: "You can add, edit, and remove cart items and complete the checkout preview. An order number identifies a record stored in your browser. It does not indicate a payment, an accepted purchase, or a shipment.",
      },
    ],
  },
];

