import express, { Router } from 'express';
import {
  addUserAddress,
  addToCart,
  addToWishlist,
  createShop,
  createStripeConnectLink,
  deleteUserAddress,
  getAdmin,
  getCart,
  getLayoutData,
  getSeller,
  getUser,
  getUserAddresses,
  getWishlist,
  loginAdmin,
  loginSeller,
  loginUser,
  logOutAdmin,
  logOutSeller,
  logOutUser,
  refreshToken,
  registerSeller,
  removeFromCart,
  removeFromWishlist,
  resetUserPassword,
  syncCart,
  updateUserPassword,
  userForgotPassword,
  userRegisteration,
  verifySeller,
  verifyUser,
  verifyUserForgotPassword,
} from '../controller/auth.controller';
import { isAuthenticated, isAdmin, isSeller } from '@packages/middleware';

const router: Router = express.Router();

router.post('/user-registeration', userRegisteration);
router.post('/verify-user', verifyUser);
router.post('/login-user', loginUser);
router.get('/logout-user', isAuthenticated, logOutUser);
router.post('/refresh-token', refreshToken);
router.get('/logged-in-user', isAuthenticated, getUser);
router.post('/forgot-password-user', userForgotPassword);
router.post('/reset-password-user', resetUserPassword);
router.post('/verify-forgot-password-user', verifyUserForgotPassword);
router.post('/seller-registertaion', registerSeller);
router.post('/verify-seller', verifySeller);
router.post('/create-shop', createShop);
router.post('/create-stripe-link', createStripeConnectLink);
router.post('/login-seller', loginSeller);
router.get('/logout-seller', isAuthenticated, isSeller, logOutSeller);
router.post('/login-admin', loginAdmin);
router.get('/logout-admin', isAuthenticated, logOutAdmin);
router.get('/logged-in-seller', isAuthenticated, isSeller, getSeller);
router.get('/logged-in-admin', isAuthenticated, isAdmin, getAdmin);
router.post('/change-password', isAuthenticated, updateUserPassword);
router.get('/shipping-addresses', isAuthenticated, getUserAddresses);
router.post('/add-address', isAuthenticated, addUserAddress);
router.delete('/delete-address/:addressId', isAuthenticated, deleteUserAddress);
router.get('/get-layouts', getLayoutData);

// Cart
router.get('/cart', isAuthenticated, getCart);
router.post('/cart', isAuthenticated, addToCart);
router.delete('/cart/:productId', isAuthenticated, removeFromCart);
router.post('/cart/sync', isAuthenticated, syncCart);

// Wishlist
router.get('/wishlist', isAuthenticated, getWishlist);
router.post('/wishlist', isAuthenticated, addToWishlist);
router.delete('/wishlist/:productId', isAuthenticated, removeFromWishlist);

export default router;
