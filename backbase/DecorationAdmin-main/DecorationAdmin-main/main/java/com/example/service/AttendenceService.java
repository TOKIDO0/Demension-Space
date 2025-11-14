package com.example.service;

import com.example.entity.Attendence;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.example.mapper.AttendenceMapper;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;

@Service
public class AttendenceService extends ServiceImpl<AttendenceMapper, Attendence> {

    @Resource
    private AttendenceMapper attendenceMapper;

}
