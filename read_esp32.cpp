#include <iostream>
#include <fcntl.h>
#include <termios.h>
#include <unistd.h>

int main() {
    int fd = open("/dev/ttyUSB1", O_RDONLY | O_NOCTTY);
    if (fd < 0) return 1;

    // Je règle la vitesse
    struct termios tty;
    tcgetattr(fd, &tty);
    cfsetispeed(&tty, B115200);
    
    tty.c_lflag |= ICANON; 
    tcsetattr(fd, TCSANOW, &tty);

    char buffer[256];
    int n = read(fd, buffer, sizeof(buffer) - 1);

    if (n > 0) {
        buffer[n] = '\0';
        std::cout << buffer; 
    }

    close(fd);
    return 0;
}
