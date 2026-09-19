package com.agenticpr.manager.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.agenticpr.manager.network.ApiClient
import com.agenticpr.manager.network.Artifact
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class GreetingState {
    object Loading : GreetingState()
    data class Success(val artifact: Artifact) : GreetingState()
    data class Empty(val message: String) : GreetingState()
    data class Error(val message: String) : GreetingState()
}

class GreetingViewModel : ViewModel() {
    private val _uiState = MutableStateFlow<GreetingState>(GreetingState.Loading)
    val uiState: StateFlow<GreetingState> = _uiState

    init {
        fetchDailyGreeting()
    }

    fun fetchDailyGreeting() {
        _uiState.value = GreetingState.Loading
        viewModelScope.launch {
            try {
                val response = ApiClient.apiService.getDailyGreeting()
                if (response.has_artifact && response.artifact != null) {
                    _uiState.value = GreetingState.Success(response.artifact)
                } else {
                    _uiState.value = GreetingState.Empty(response.message)
                }
            } catch (e: Exception) {
                _uiState.value = GreetingState.Error(e.message ?: "Network error")
            }
        }
    }

    fun tweakGreeting(artifactId: String, instruction: String) {
        // ... calls ApiClient.apiService.tweakGreeting(...)
    }
}
