import React, { useState, useEffect, useRef } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  Input,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useAuth } from "../providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { apiRequest } from "../api/apiRequest";

function DeleteAccount() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, dispatch } = useAuth();
  const navigate = useNavigate();
  const cancelRef = useRef<HTMLButtonElement>(null!);

  const [randomCode, setRandomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Generate a random 4-digit code
  const generateRandomCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setRandomCode(code);
  };

  // Reset input and generate a new code when the AlertDialog opens
  useEffect(() => {
    if (isOpen) {
      generateRandomCode();
      setInputCode("");
      setError("");
    }
  }, [isOpen]);

  const handleDelete = async () => {
    // Check for code mismatch
    if (inputCode !== randomCode) {
      setError("Code mismatch! Please try again.");
      generateRandomCode(); // Generate a new code
      setInputCode("");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiRequest("users", "DELETE", `${user?.id}`);

      if (response.success) {
        setIsSuccessDialogOpen(true); // Open success dialog
        setTimeout(() => {
          dispatch({
            type: "LOGOUT",
            payload: null,
          });
          navigate("/");
        }, 3000); // Redirect after showing success dialog
      } else {
        setErrorMessage(response.message || "Failed to delete account.");
        setIsErrorDialogOpen(true); // Open error dialog
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setErrorMessage("An error occurred while deleting your account.");
      setIsErrorDialogOpen(true); // Open error dialog
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <>
      {/* Delete Account Trigger */}
      <button
        onClick={onOpen}
        className="absolute top-8 right-8 text-red-500 flex items-center gap-2 hover:text-red-600"
      >
        <Trash2 size={20} />
        <span>Delete Account</span>
      </button>

      {/* Main Delete Account Confirmation AlertDialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="red.500">
              Delete Account
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text>
                Are you sure you want to delete your account? This action cannot
                be undone and will permanently delete all your data.
              </Text>
              <Text mt={4} fontWeight="bold">
                To confirm deletion, please type in the following code:
              </Text>
              <Text fontSize="2xl" color="red.500" mt={2} textAlign="center">
                {randomCode}
              </Text>
              <Input
                placeholder="Enter the code"
                mt={4}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
              />
              {error && (
                <Text color="red.500" mt={2}>
                  {error}
                </Text>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} isDisabled={isDeleting}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                ml={3}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Success Modal */}
      <AlertDialog
        isOpen={isSuccessDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsSuccessDialogOpen(false)}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader
              fontSize="lg"
              fontWeight="bold"
              color="green.500"
            >
              Account Deleted
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text>Your account has been successfully deleted.</Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={() => setIsSuccessDialogOpen(false)}>
                Close
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Error Modal */}
      <AlertDialog
        isOpen={isErrorDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsErrorDialogOpen(false)}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="red.500">
              Error
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text>{errorMessage}</Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={() => setIsErrorDialogOpen(false)}>Close</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

export default DeleteAccount;
