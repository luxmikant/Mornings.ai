package com.agenticpr.manager

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    DailyGreetingScreen()
                }
            }
        }
    }
}

@Composable
fun DailyGreetingScreen() {
    val context = LocalContext.current
    
    // Mock data for UI scaffolding
    val eventName = "Makar Sankranti"
    val imageUrl = "https://example.com/mock-greeting.webp"
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Today's Event: $eventName",
            style = MaterialTheme.typography.headlineSmall
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // This will load the composite image from R2
        AsyncImage(
            model = imageUrl,
            contentDescription = "Generated Greeting Card",
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(0.8f) // 1080x1350 ratio
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Button(onClick = { /* Tweak API Call */ }) {
                Text("Tweak Text")
            }
            
            Button(onClick = {
                // Single-Tap One-Click Dispatch to WhatsApp
                val sendIntent: Intent = Intent().apply {
                    action = Intent.ACTION_SEND
                    putExtra(Intent.EXTRA_TEXT, "Wishing you a joyous $eventName! #AgenticPR")
                    type = "text/plain"
                    // In a real implementation, we would pass a URI to the image and set type to "image/webp"
                }
                val shareIntent = Intent.createChooser(sendIntent, null)
                context.startActivity(shareIntent)
            }) {
                Text("Share Now")
            }
        }
    }
}
