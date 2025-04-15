import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, CardMedia, Typography, Button, TextField, Box, Container } from '@mui/material';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

interface Room {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  image: string;
}

const Home = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const roomsCollection = collection(db, 'rooms');
        const snapshot = await getDocs(roomsCollection);
        const roomsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Room[];
        setRooms(roomsData);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };

    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter(room =>
    room.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Find Your Perfect Bachelor Room
        </Typography>
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
        </Box>
        <Grid container spacing={4}>
          {filteredRooms.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room.id}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={room.image}
                    alt={room.title}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      {room.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {room.description}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      ₹{room.price}/month
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Location: {room.location}
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => navigate(`/room/${room.id}`)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default Home; 